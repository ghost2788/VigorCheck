import React, { createContext, ReactNode, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  AnalysisDraft,
  AnalysisJob,
  AnalysisJobOriginCard,
  PhotoAnalysisInput,
  TextAnalysisInput,
} from "../domain/analysisQueue";

type ScanFlowContextValue = {
  activeReviewJob: AnalysisJob | null;
  clearActiveReview: () => void;
  completeReviewJob: (jobId: string) => void;
  dismissJob: (jobId: string) => void;
  enqueuePhotoJob: (input: Omit<PhotoAnalysisInput, "type">) => string;
  enqueueTextJob: (input: Omit<TextAnalysisInput, "type">) => string;
  getJobsForOrigin: (originCard: AnalysisJobOriginCard) => AnalysisJob[];
  jobs: AnalysisJob[];
  openReviewJob: (jobId: string) => void;
  retryJob: (jobId: string) => void;
  updateActiveDraft: (updater: (draft: AnalysisDraft) => AnalysisDraft) => void;
};

const ScanFlowContext = createContext<ScanFlowContextValue | null>(null);

function clipPreview(value: string, maxLength = 56) {
  const normalized = value.trim().replace(/\s+/g, " ");

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 1).trimEnd()}...`;
}

function buildPhotoPreview(input: Omit<PhotoAnalysisInput, "type">) {
  return `${input.mealType.charAt(0).toUpperCase()}${input.mealType.slice(1)} photo`;
}

function buildTextPreview(input: Omit<TextAnalysisInput, "type">) {
  return clipPreview(input.description);
}

export function ScanFlowProvider({ children }: { children: ReactNode }) {
  const analyzePhoto = useAction(api.scanAnalysis.analyzePhoto);
  const analyzeText = useAction(api.textAnalysis.analyzeMealDescription);
  const idRef = useRef(0);
  const isMountedRef = useRef(true);
  const [jobs, setJobs] = useState<AnalysisJob[]>([]);
  const [activeReviewJobId, setActiveReviewJobId] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (jobs.some((job) => job.status === "analyzing")) {
      return;
    }

    const nextJob = jobs.find((job) => job.status === "queued");

    if (!nextJob) {
      return;
    }

    const jobId = nextJob.id;

    setJobs((current) =>
      current.map((job) =>
        job.id === jobId
          ? {
              ...job,
              error: undefined,
              status: "analyzing",
            }
          : job
      )
    );

    void (async () => {
      try {
        const draft = await (async () => {
          if (nextJob.source === "photo") {
            const input = nextJob.input as PhotoAnalysisInput;

            return analyzePhoto({
              base64: input.base64,
              mealType: input.mealType,
              mimeType: input.mimeType,
            });
          }

          const input = nextJob.input as TextAnalysisInput;

          return analyzeText({
            description: input.description,
            mealType: input.mealType,
          });
        })();

        if (!isMountedRef.current) {
          return;
        }

        setJobs((current) =>
          current.map((job) =>
            job.id === jobId
              ? {
                  ...job,
                  draft,
                  error: undefined,
                  status: "ready",
                }
              : job
          )
        );
      } catch (error) {
        if (!isMountedRef.current) {
          return;
        }

        setJobs((current) =>
          current.map((job) =>
            job.id === jobId
              ? {
                  ...job,
                  error:
                    error instanceof Error
                      ? error.message
                      : "This AI entry could not be analyzed right now.",
                  status: "failed",
                }
              : job
          )
        );
      }
    })();

  }, [analyzePhoto, analyzeText, jobs]);

  const value = useMemo<ScanFlowContextValue>(
    () => ({
      activeReviewJob: activeReviewJobId ? jobs.find((job) => job.id === activeReviewJobId) ?? null : null,
      clearActiveReview: () => setActiveReviewJobId(null),
      completeReviewJob: (jobId) => {
        setJobs((current) => current.filter((job) => job.id !== jobId));
        setActiveReviewJobId((current) => (current === jobId ? null : current));
      },
      dismissJob: (jobId) => {
        setJobs((current) => current.filter((job) => job.id !== jobId));
        setActiveReviewJobId((current) => (current === jobId ? null : current));
      },
      enqueuePhotoJob: (input) => {
        idRef.current += 1;
        const jobId = `photo-${Date.now()}-${idRef.current}`;
        const nextJob: AnalysisJob = {
          createdAt: Date.now(),
          id: jobId,
          input: {
            ...input,
            type: "photo",
          },
          labelPreview: buildPhotoPreview(input),
          originCard: "scan",
          source: "photo",
          status: "queued",
        };
        setJobs((current) => [...current, nextJob]);
        return jobId;
      },
      enqueueTextJob: (input) => {
        idRef.current += 1;
        const jobId = `text-${Date.now()}-${idRef.current}`;
        const nextJob: AnalysisJob = {
          createdAt: Date.now(),
          id: jobId,
          input: {
            ...input,
            type: "text",
          },
          labelPreview: buildTextPreview(input),
          originCard: "text",
          source: "text",
          status: "queued",
        };
        setJobs((current) => [...current, nextJob]);
        return jobId;
      },
      getJobsForOrigin: (originCard) => jobs.filter((job) => job.originCard === originCard),
      jobs,
      openReviewJob: (jobId) => setActiveReviewJobId(jobId),
      retryJob: (jobId) => {
        setJobs((current) =>
          current.map((job) =>
            job.id === jobId
              ? {
                  ...job,
                  draft: undefined,
                  error: undefined,
                  status: "queued",
                }
              : job
          )
        );
      },
      updateActiveDraft: (updater) => {
        setJobs((current) =>
          current.map((job) =>
            job.id === activeReviewJobId && job.draft
              ? {
                  ...job,
                  draft: updater(job.draft),
                }
              : job
          )
        );
      },
    }),
    [activeReviewJobId, jobs]
  );

  return <ScanFlowContext.Provider value={value}>{children}</ScanFlowContext.Provider>;
}

export function useScanFlow() {
  const context = useContext(ScanFlowContext);

  if (!context) {
    throw new Error("useScanFlow must be used within ScanFlowProvider.");
  }

  return context;
}
