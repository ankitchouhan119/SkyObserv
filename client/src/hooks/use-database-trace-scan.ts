import { useCallback, useEffect, useState } from "react";
import { useApolloClient } from "@apollo/client";
import { GET_TRACES_FOR_DB, GET_TRACE_DETAILS } from "@/apollo/queries/database";
import { useDurationStore } from "@/store/useDurationStore";
import {
  DbSpanRow,
  extractStatement,
  isStorageSpan,
} from "@/lib/dbTraceAnalysis";

type TraceListItem = {
  traceIds?: string[];
  key?: string;
};

type RawSpan = {
  traceId?: string;
  segmentId?: string;
  spanId: number;
  startTime: number;
  endTime: number;
  endpointName?: string;
  type?: string;
  peer?: string;
  component?: string;
  layer?: string;
  isError?: boolean;
  serviceCode?: string;
  tags?: Array<{ key: string; value: string }>;
};

export function useDatabaseTraceScan(pageSize = 60) {
  const client = useApolloClient();
  const { durationObj } = useDurationStore();
  const [spans, setSpans] = useState<DbSpanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const scan = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: listData } = await client.query({
        query: GET_TRACES_FOR_DB,
        variables: {
          condition: {
            queryDuration: durationObj,
            traceState: "ALL",
            queryOrder: "BY_START_TIME",
            paging: { pageNum: 1, pageSize },
          },
        },
        fetchPolicy: "network-only",
      });

      const basicTraces: TraceListItem[] = listData?.queryBasicTraces?.traces ?? [];
      const foundSpans: DbSpanRow[] = [];

      const detailResults = await Promise.all(
        basicTraces.map((trace) => {
          const traceId = trace.traceIds?.[0] || trace.key;
          if (!traceId) return Promise.resolve(null);
          return client.query({
            query: GET_TRACE_DETAILS,
            variables: { traceId },
            fetchPolicy: "network-only",
          });
        }),
      );

      detailResults.forEach((result, index) => {
        if (!result) return;
        const traceId = basicTraces[index]?.traceIds?.[0] || basicTraces[index]?.key || "";
        const rawSpans: RawSpan[] = result.data?.queryTrace?.spans ?? [];

        rawSpans.forEach((span) => {
          if (!isStorageSpan(span)) return;

          foundSpans.push({
            key: `${traceId}:${span.segmentId ?? "seg"}:${span.spanId}:${span.startTime}`,
            traceId: span.traceId || traceId,
            spanId: span.spanId,
            segmentId: span.segmentId || "",
            statement: extractStatement(span),
            latency: Math.max(1, span.endTime - span.startTime),
            time: span.startTime,
            component: span.component || "Storage",
            peer: span.peer || "",
            serviceCode: span.serviceCode || "unknown",
            isError: Boolean(span.isError),
          });
        });
      });

      setSpans(foundSpans.sort((a, b) => b.time - a.time));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to scan database traces");
      setSpans([]);
    } finally {
      setLoading(false);
    }
  }, [client, durationObj, pageSize]);

  useEffect(() => {
    scan();
  }, [scan]);

  return { spans, loading, error, refresh: scan };
}
