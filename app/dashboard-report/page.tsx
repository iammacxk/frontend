"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { APIProvider, Map, AdvancedMarker, useMap } from "@vis.gl/react-google-maps";
import { useAuth } from "../context/AuthContext";
import { useProvince } from "../context/ProvinceContext";
import { dashBoardService } from "../../lib/services/dashBoardService";
import { repeatService } from "../../lib/services/repeatService";
import { RiskSummary, DropoutTrend, RiskStudent } from "../../lib/types/dashboardTypes";
import type { RepeatGradeItem } from "../../lib/types/repeatTypes";
import "./dashboard.css";

type GradeFilter = "all" | "primary" | "secondary" | "university";

type GradeLevelValue = string | { name?: string | null } | null | undefined;

type DashboardDropoutItem = {
  gradeLevel?: GradeLevelValue;
  gradeLevelName?: string | null;
  grade?: string | null;
};

function getGradeLabel(item: unknown): string {
  const value = item as DashboardDropoutItem;
  const gradeLevel = value?.gradeLevel;

  if (typeof gradeLevel === "string") {
    return gradeLevel;
  }

  if (gradeLevel && typeof gradeLevel === "object") {
    return gradeLevel.name ?? "";
  }

  return (
    value?.gradeLevelName ??
    value?.gradeLevelName ??
    value?.grade ??
    ""
  );
}

function matchesGradeFilter(label: string, filter: GradeFilter): boolean {
  const text = label.toLowerCase();

  if (filter === "all") return true;

  const isUniversity =
    /มหาวิทยาลัย|มหาลัย|university|อุดมศึกษา|ปวช|ปวส|ป\.ตรี|ปริญญา|บัณฑิต/.test(
      text,
    );
  const isPrimary = /ประถม|primary|ป\./.test(text);
  const isSecondary = /มัธยม|secondary|ม\./.test(text);

  if (filter === "primary") return isPrimary && !isUniversity;
  if (filter === "secondary") return isSecondary && !isUniversity && !isPrimary;
  return isUniversity;
}

function KpiGrid({
  onSelectKpi,
  dropoutsCount,
  repeatersCount,
  atRiskCount,
  completenessCount
}: {
  onSelectKpi: (id: string) => void;
  dropoutsCount: number;
  repeatersCount: number;
  atRiskCount: number;
  completenessCount: number;
}) {
  const kpiData = [
    {
      id: "dropouts",
      icon: "",
      colorClass: "ca-rose",
      iconBg: "rgba(232,69,122,.10)",
      iconBorder: "rgba(232,69,122,.18)",
      textColor: "var(--rose)",
      num: dropoutsCount.toLocaleString(),
      lbl: "นักเรียนหลุดออกจากระบบ",
      trendClass: "dashboard-t-up",
      trendText: "",
      drillText: "ดูรายชื่อ →",
    },
    {
      id: "repeaters",
      icon: "",
      colorClass: "ca-peach",
      iconBg: "rgba(224,112,48,.10)",
      iconBorder: "rgba(224,112,48,.18)",
      textColor: "var(--peach)",
      num: repeatersCount.toLocaleString(),
      lbl: "นักเรียนซ้ำชั้น",
      trendClass: "dashboard-t-down",
      trendText: "-",
      drillText: "ดูรายชื่อ →",
    },
    {
      id: "atrisk",
      icon: "",
      colorClass: "ca-amber",
      iconBg: "rgba(217,119,6,.10)",
      iconBorder: "rgba(217,119,6,.18)",
      textColor: "var(--amber)",
      num: atRiskCount.toLocaleString(),
      lbl: "นักเรียนกลุ่มเสี่ยง (สูง/กลาง)",
      trendClass: "dashboard-t-up",
      trendText: "-",
      drillText: "ดูรายชื่อ →",
    },
    {
      id: "completeness",
      icon: "",
      colorClass: "ca-violet",
      iconBg: "rgba(124,58,237,.10)",
      iconBorder: "rgba(124,58,237,.18)",
      textColor: "var(--violet)",
      num: completenessCount.toLocaleString(),
      lbl: "แบบรายงานที่ค้างส่ง",
      trendClass: "dashboard-t-flat",
      trendText: "≈ ไม่เปลี่ยนแปลง",
      drillText: "ดูรายละเอียด →",
    },
  ];

  // SVG icons for KPI cards
  const KPI_ICONS: Record<string, React.ReactNode> = {
    dropouts: (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M16 17l5-5-5-5M19.8 12H9M13 22a10 10 0 110-20" />
      </svg>
    ),
    repeaters: (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="23 4 23 10 17 10" />
        <polyline points="1 20 1 14 7 14" />
        <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
      </svg>
    ),
    atrisk: (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    completeness: (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  };

  return (
    <div className="dashboard-bento" style={{ marginBottom: "14px" }}>
      {kpiData.map((kpi) => (
        <div
          key={kpi.id}
          className={`dashboard-card dashboard-kpi-card`}
          onClick={() => onSelectKpi(kpi.id)}
        >
          <div
            className="dashboard-kpi-icon"
            style={{
              background: kpi.iconBg,
              border: `1px solid ${kpi.iconBorder}`,
              color: kpi.textColor,
            }}
          >
            {KPI_ICONS[kpi.id]}
          </div>
          <div className="dashboard-kpi-num" style={{ color: kpi.textColor }}>
            {kpi.num}
          </div>
          <div className="dashboard-kpi-lbl">{kpi.lbl}</div>
          <span className={`dashboard-kpi-trend ${kpi.trendClass}`}>
            {kpi.trendText}
          </span>
          <div className="dashboard-kpi-drill" style={{ color: kpi.textColor }}>
            {kpi.drillText}
          </div>
        </div>
      ))}
    </div>
  );
}

// --- RadialRingChart (แทน DonutChart เดิม) ---
export function RadialRingChart({
  dropoutsCount,
  repeatersCount,
  atRiskCount,
}: {
  dropoutsCount: number;
  repeatersCount: number;
  atRiskCount: number;
}) {
  const { selectedYear } = useProvince();
  const total = dropoutsCount + repeatersCount + atRiskCount;

  const segments = [
    {
      label: "หลุดออกจากระบบ",
      value: dropoutsCount,
      color: "#f43f5e",
      textColor: "#be123c",
      softBg: "rgba(244,63,94,.12)",
    },
    {
      label: "ซ้ำชั้น",
      value: repeatersCount,
      color: "#f59e0b",
      textColor: "#b45309",
      softBg: "rgba(245,158,11,.12)",
    },
    {
      label: "กลุ่มเสี่ยง",
      value: atRiskCount,
      color: "#8b5cf6",
      textColor: "#6d28d9",
      softBg: "rgba(139,92,246,.12)",
    },
  ];

  const radius = 58;
  const strokeWidth = 20;
  const circumference = 2 * Math.PI * radius;
  const hasData = total > 0;

  const donut = segments.map((seg, idx) => {
    const ratio = hasData ? seg.value / total : 0;
    const length = ratio * circumference;
    const offsetLen = segments
      .slice(0, idx)
      .reduce((sum, s) => sum + (hasData ? (s.value / total) * circumference : 0), 0);
    return {
      ...seg,
      ratio,
      length,
      dashOffset: circumference / 4 - offsetLen,
    };
  });

  return (
    <div className="dashboard-card">
      <div className="dashboard-sec-title" style={{ marginBottom: 14 }}>
        สัดส่วนนักเรียนตามประเภท
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 20,
          flexWrap: "wrap",
          flex: 1,
          justifyContent: "center",
        }}
      >
        <div style={{ position: "relative", flexShrink: 0 }}>
          <svg viewBox="0 0 180 180" style={{ width: 170, height: 170, display: "block" }}>
            <circle
              cx="90"
              cy="90"
              r={radius}
              fill="none"
              stroke="rgba(148,163,184,.25)"
              strokeWidth={strokeWidth}
            />
            {donut.map((seg) => (
              <circle
                key={seg.label}
                cx="90"
                cy="90"
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth={strokeWidth}
                strokeLinecap="butt"
                strokeDasharray={`${seg.length} ${circumference}`}
                strokeDashoffset={seg.dashOffset}
                style={{ transition: "stroke-dasharray .4s ease" }}
              />
            ))}

            <text x="90" y="85" textAnchor="middle" fontSize={24} fontWeight={800} fill="var(--text-h, #111827)">
              {total.toLocaleString()}
            </text>
            <text x="90" y="102" textAnchor="middle" fontSize={10} fill="var(--text-m, #6b7280)" fontWeight={600}>
              คนทั้งหมด
            </text>
          </svg>
        </div>

        <div
          style={{
            flex: 1,
            minWidth: 160,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {segments.map((seg) => {
            const pct = hasData ? ((seg.value / total) * 100).toFixed(1) : "0.0";
            return (
              <div key={seg.label} style={{ border: "1px solid var(--dashboard-card-soft-border, #e5e7eb)", borderRadius: 9, padding: "7px 9px", background: "var(--dashboard-card-soft-bg, #f8fafc)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <div style={{ width: 9, height: 9, borderRadius: "50%", background: seg.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: "var(--text-b)", fontWeight: 600 }}>{seg.label}</span>
                  </div>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: seg.textColor, background: seg.softBg, borderRadius: 6, padding: "2px 8px" }}>
                    {pct}%
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5 }}>
                  <span style={{ color: "var(--text-m, #6b7280)" }}>จำนวน</span>
                  <span style={{ fontWeight: 700, color: "var(--text-h, #111827)" }}>{seg.value.toLocaleString()} คน</span>
                </div>
              </div>
            );
          })}
          {!hasData && (
            <div style={{ fontSize: 11, color: "var(--text-m, #6b7280)" }}>
              ยังไม่มีข้อมูลในเงื่อนไขที่เลือก
            </div>
          )}
          <div style={{ marginTop: 2, paddingTop: 6, borderTop: "1px solid rgba(0,0,0,.07)", fontSize: 10, color: "var(--text-m)" }}>
            ปีการศึกษา {selectedYear}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- StackedBarGlowChart (แทน GradientLineChart เดิม) ---
const YEARS = ["2562", "2563", "2564", "2565", "2566", "2567"];

const mockData = {
  dropout: [52, 60, 48, 40, 32, 18],
  repeater: [38, 35, 33, 30, 26, 22],
  atrisk: [70, 67, 63, 58, 52, 44],
};

const VW = 520;
const VH = 130;
const BAR_W = 18;
const GROUP_W = 72;
const PADDING_LEFT = 28;
const CHART_H = 100;
const BASE_Y = 118;

function scaleH(val: number): number {
  return Math.round((val / 100) * CHART_H);
}

export function StackedBarGlowChart({ trendData }: { trendData: DropoutTrend[] }) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(t);
  }, [trendData]);

  const dropoutVals =
    trendData && trendData.length === 6
      ? trendData.map((t) => Math.min(100, Math.max(0, t.dropout || 0)))
      : mockData.dropout;

  const series = [
    { key: "dropout", vals: dropoutVals, color: "#f43f5e", glow: "rgba(244,63,94,.5)", label: "หลุดออก" },
    { key: "repeater", vals: mockData.repeater, color: "#f59e0b", glow: "rgba(245,158,11,.4)", label: "ซ้ำชั้น" },
    { key: "atrisk", vals: mockData.atrisk, color: "#8b5cf6", glow: "rgba(139,92,246,.4)", label: "กลุ่มเสี่ยง" },
  ];

  const trendPoints = dropoutVals.map((val, i) => {
    const x = PADDING_LEFT + i * GROUP_W + GROUP_W / 2;
    const y = BASE_Y - scaleH(val);
    return `${x},${y}`;
  });
  const trendPolyline = trendPoints.join(" ");
  const gridLines = [25, 50, 75];

  return (
    <div className="dashboard-card dashboard-b3">
      <div className="dashboard-sec-hdr" style={{ marginBottom: 12 }}>
        <div>
          <div className="dashboard-sec-title">แนวโน้มย้อนหลัง 6 ปีการศึกษา</div>
          <div className="dashboard-sec-sub">จำนวนนักเรียนตามประเภท (ปรับมาตรฐาน)</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 14, marginBottom: 12 }}>
        {series.map((s) => (
          <span key={s.key} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10.5, color: "var(--text-m)" }}>
            <span style={{ width: 9, height: 9, borderRadius: 2, background: s.color, display: "inline-block", boxShadow: `0 0 5px ${s.glow}` }} />
            {s.label}
          </span>
        ))}
        <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10.5, color: "var(--text-m)", marginLeft: 4 }}>
          <svg width="18" height="6" style={{ display: "inline-block" }}>
            <line x1="0" y1="3" x2="18" y2="3" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" />
            <circle cx="9" cy="3" r="2" fill="#f43f5e" />
          </svg>
          แนวโน้มหลุดออก
        </span>
      </div>

      <div style={{ width: "100%", overflowX: "auto" }}>
        <svg viewBox={`0 0 ${VW} ${VH + 20}`} width="100%" style={{ display: "block", overflow: "visible" }}>
          <defs>
            {series.map((s) => (
              <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity=".95" />
                <stop offset="100%" stopColor={s.color} stopOpacity=".55" />
              </linearGradient>
            ))}
            <filter id="lineGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {gridLines.map((g) => {
            const gy = BASE_Y - scaleH(g);
            return (
              <g key={g}>
                <line x1={PADDING_LEFT} y1={gy} x2={VW - 4} y2={gy} stroke="rgba(255,255,255,.06)" strokeWidth=".8" strokeDasharray="4 3" />
                <text x={PADDING_LEFT - 4} y={gy + 3.5} textAnchor="end" fontSize={8} fill="rgba(156,163,175,.5)" fontFamily="sans-serif">
                  {g}
                </text>
              </g>
            );
          })}

          <line x1={PADDING_LEFT} y1={BASE_Y} x2={VW - 4} y2={BASE_Y} stroke="rgba(255,255,255,.08)" strokeWidth="1" />

          {YEARS.map((yr, gi) => {
            const groupX = PADDING_LEFT + gi * GROUP_W;
            return (
              <g key={yr}>
                {series.map((s, si) => {
                  const h = animated ? scaleH(s.vals[gi]) : 0;
                  const barX = groupX + si * (BAR_W + 3);
                  return (
                    <rect
                      key={s.key}
                      x={barX}
                      y={BASE_Y - h}
                      width={BAR_W}
                      height={h}
                      rx={3}
                      fill={`url(#grad-${s.key})`}
                      style={{ transition: `y .65s cubic-bezier(.4,0,.2,1) ${gi * 0.05}s, height .65s cubic-bezier(.4,0,.2,1) ${gi * 0.05}s` }}
                    />
                  );
                })}
                <text x={groupX + GROUP_W / 2 - 3} y={BASE_Y + 12} textAnchor="middle" fontSize={9} fill="rgba(156,163,175,.7)" fontFamily="sans-serif">
                  {yr}
                </text>
              </g>
            );
          })}

          {animated && (
            <>
              <polyline points={trendPolyline} fill="none" stroke="#f43f5e" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" filter="url(#lineGlow)" opacity={0.45} />
              <polyline points={trendPolyline} fill="none" stroke="#f43f5e" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
              {dropoutVals.map((val, i) => {
                const x = PADDING_LEFT + i * GROUP_W + GROUP_W / 2;
                const y = BASE_Y - scaleH(val);
                const isLast = i === dropoutVals.length - 1;
                return (
                  <circle
                    key={i}
                    cx={x}
                    cy={y}
                    r={isLast ? 5 : 3.5}
                    fill="#f43f5e"
                    stroke={isLast ? "var(--card-bg, #fff)" : "none"}
                    strokeWidth={isLast ? 2 : 0}
                    filter={isLast ? "url(#lineGlow)" : undefined}
                  />
                );
              })}
            </>
          )}
        </svg>
      </div>
    </div>
  );
}

// --- RiskMap ---
type RiskRank = {
  num: string;
  numClass: string;
  prov: string;
  count: string;
  w: string;
  bg: string;
};

type RiskMarker = {
  lat: number;
  lng: number;
  radius: number;
  color: string;
  label: string;
  count: string;
};

function RiskMap({ riskSummary }: { riskSummary: RiskSummary | null }) {
  const { user } = useAuth();
  const { selectedYear } = useProvince();
  const isProvince = user?.role !== "System Admin" && user?.role !== "Policy User";
  const userArea = user?.area || "";

  // Since backend doesn't provide lat/long or province grouping for risk yet, 
  // we will leave this empty as requested to remove all mock data.
  const ranks: RiskRank[] = [];
  const riskMarkers: RiskMarker[] = [];




  function RiskMarkerPin({
    color,
    label,
    count,
  }: {
    color: string;
    label: string;
    count: string;
  }) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          cursor: "pointer",
        }}
      >
        <div
          style={{
            background: "white",
            borderRadius: 8,
            padding: "4px 8px",
            boxShadow: "0 2px 8px rgba(0,0,0,.18)",
            border: `2px solid ${color}`,
            fontSize: 11,
            fontWeight: 700,
            color: color,
            whiteSpace: "nowrap",
            marginBottom: 4,
            lineHeight: 1.3,
            textAlign: "center",
          }}
        >
          <div>{label}</div>
          <div style={{ fontSize: 10, fontWeight: 500, color: "var(--text-m, #6b7280)" }}>
            {count}
          </div>
        </div>
        <div
          style={{
            width: 14,
            height: 14,
            borderRadius: "50%",
            background: color,
            border: "2.5px solid white",
            boxShadow: `0 0 0 3px ${color}33, 0 2px 6px rgba(0,0,0,.2)`,
          }}
        />
      </div>
    );
  }

  // Draw circles on map for area coverage
  function RiskCircles({ markers }: { markers: typeof riskMarkers }) {
    const map = useMap();

    React.useEffect(() => {
      if (!map) return;
      const circles: google.maps.Circle[] = [];
      markers.forEach((m) => {
        const circle = new google.maps.Circle({
          map,
          center: { lat: m.lat, lng: m.lng },
          radius: m.radius,
          fillColor: m.color,
          fillOpacity: 0.18,
          strokeColor: m.color,
          strokeOpacity: 0.45,
          strokeWeight: 2,
        });
        circles.push(circle);
      });
      return () => {
        circles.forEach((c) => c.setMap(null));
      };
    }, [map, markers]);

    return null;
  }



  const displayMarkers = isProvince
    ? // Filter by matching label to the user's area, or default to all if not found
    riskMarkers.filter(
      (m) => userArea.includes(m.label) || m.label.includes(userArea),
    )
    : riskMarkers;

  // If we filtered down to zero markers (e.g. area name not in mock data), just show all or show none.
  // For demo purposes, we will fallback to all if empty. We can refine this later if needed.
  const finalMarkers = displayMarkers.length > 0 ? displayMarkers : riskMarkers;

  // Set default center based on filtered markers
  const centerLat = finalMarkers.length === 1 ? finalMarkers[0].lat : 13.0;
  const centerLng = finalMarkers.length === 1 ? finalMarkers[0].lng : 101.0;
  const zoomLvl = finalMarkers.length === 1 ? 9 : 5.8;

  return (
    <div className="dashboard-card dashboard-b4">
      <div className="dashboard-sec-hdr" style={{ flexWrap: "wrap", gap: 8 }}>
        <div>
          <div className="dashboard-sec-title">แผนที่ความเสี่ยงรายพื้นที่</div>
          <div className="dashboard-sec-sub">
            แสดงระดับความเสี่ยงนักเรียนตามจังหวัด ปีการศึกษา {selectedYear}
            {riskSummary ? ` | รวมความเสี่ยง ${riskSummary.totalRiskIncludeWatch}` : ""}
          </div>
        </div>
        <div
          className="dashboard-flex dashboard-gap2"
          style={{ flexWrap: "wrap" }}
        >
          <span className="dashboard-badge dashboard-b-rose">เสี่ยงสูงมาก</span>
          <span className="dashboard-badge dashboard-b-peach">เสี่ยงสูง</span>
          <span className="dashboard-badge dashboard-b-amber">ปานกลาง</span>
          <span className="dashboard-badge dashboard-b-mint">เสี่ยงต่ำ</span>
        </div>
      </div>

      <div className="dashboard-risk-layout">
        {/* Google Map */}
        <div style={{ position: "relative" }}>
          <div
            style={{
              width: "100%",
              height: "420px",
              borderRadius: 14,
              overflow: "hidden",
              border: "1px solid rgba(0,0,0,.08)",
            }}
          >
            <APIProvider
              apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""}
            >
              <Map
                defaultCenter={{ lat: centerLat, lng: centerLng }}
                defaultZoom={zoomLvl}
                gestureHandling="cooperative"
                disableDefaultUI
                zoomControl
                mapId="risk-map"
                style={{ width: "100%", height: "100%" }}
              >
                <RiskCircles markers={finalMarkers} />
                {finalMarkers.map((marker) => (
                  <AdvancedMarker
                    key={marker.label}
                    position={{ lat: marker.lat, lng: marker.lng }}
                  >
                    <RiskMarkerPin
                      color={marker.color}
                      label={marker.label}
                      count={marker.count}
                    />
                  </AdvancedMarker>
                ))}
              </Map>
            </APIProvider>
          </div>
          {/* Map legend */}
          <div
            className="dashboard-map-legend"
            style={{
              position: "absolute",
              bottom: 10,
              left: "50%",
              transform: "translateX(-50%)",
              background: "var(--dashboard-map-legend-bg)",
              backdropFilter: "blur(6px)",
              borderRadius: 10,
              padding: "6px 14px",
              boxShadow: "0 2px 8px rgba(0,0,0,.1)",
            }}
          >
            <div className="dashboard-legend-item">
              <div
                className="dashboard-legend-dot"
                style={{ background: "rgba(239,68,68,.75)" }}
              ></div>
              สูงมาก
            </div>
            <div className="dashboard-legend-item">
              <div
                className="dashboard-legend-dot"
                style={{ background: "rgba(249,115,22,.72)" }}
              ></div>
              สูง
            </div>
            <div className="dashboard-legend-item">
              <div
                className="dashboard-legend-dot"
                style={{ background: "rgba(234,179,8,.75)" }}
              ></div>
              ปานกลาง
            </div>
            <div className="dashboard-legend-item">
              <div
                className="dashboard-legend-dot"
                style={{ background: "rgba(34,197,94,.65)" }}
              ></div>
              ต่ำ
            </div>
          </div>
        </div>

        {/* Top 5 Ranking */}
        <div>
          <div
            style={{
              fontSize: "12px",
              fontWeight: 700,
              color: "var(--text-m)",
              textTransform: "uppercase",
              letterSpacing: ".8px",
              marginBottom: "10px",
            }}
          >
            5 อันดับพื้นที่เสี่ยงสูงสุด
          </div>
          <div className="dashboard-rank-list">
            {ranks.map((r) => (
              <div key={r.num} className="dashboard-rank-item">
                <div className={`dashboard-rank-num dashboard-${r.numClass}`}>
                  {r.num}
                </div>
                <div className="dashboard-rank-info">
                  <div className="dashboard-rank-province">{r.prov}</div>
                  <div className="dashboard-rank-count">{r.count}</div>
                </div>
                <div className="dashboard-rank-bar-wrap">
                  <div className="dashboard-rank-bar-bg">
                    <div
                      className="dashboard-rank-bar-fill"
                      style={{ width: r.w, background: r.bg }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* Quick stats */}
          <div
            style={{
              marginTop: "14px",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "8px",
            }}
          >
            <div
              style={{
                background: "rgba(239,68,68,.06)",
                border: "1px solid rgba(239,68,68,.16)",
                borderRadius: "10px",
                padding: "10px",
                textAlign: "center",
              }}
            >
              <div
                style={{ fontSize: "22px", fontWeight: 800, color: "#dc2626" }}
              >
                12
              </div>
              <div
                style={{
                  fontSize: "10.5px",
                  color: "var(--text-m)",
                  marginTop: "2px",
                }}
              >
                จังหวัดเสี่ยงสูง
              </div>
            </div>
            <div
              style={{
                background: "rgba(234,179,8,.06)",
                border: "1px solid rgba(234,179,8,.18)",
                borderRadius: "10px",
                padding: "10px",
                textAlign: "center",
              }}
            >
              <div
                style={{ fontSize: "22px", fontWeight: 800, color: "#b45309" }}
              >
                28
              </div>
              <div
                style={{
                  fontSize: "10.5px",
                  color: "var(--text-m)",
                  marginTop: "2px",
                }}
              >
                จังหวัดปานกลาง
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



// --- Main Page ---

const KPI_ROUTES: Record<string, string> = {
  dropouts: "/dashboard-report/Dropped-OutStudents",
  repeaters: "/dashboard-report/RepeatedGradeStudents",
  atrisk: "/dashboard-report/At-RiskStudents",
  completeness: "/dashboard-report/DataCompleteness",
};

export default function DashboardPage() {
  const router = useRouter();
  const { selectedYear, setSelectedYear } = useProvince();

  // States
  const [semester, setSemester] = useState<string>("1");
  const [gradeFilter, setGradeFilter] = useState<GradeFilter>("all");
  const [loading, setLoading] = useState(true);
  const [dropoutItems, setDropoutItems] = useState<DashboardDropoutItem[]>([]);
  const [riskItems, setRiskItems] = useState<RiskStudent[]>([]);
  const [repeatItems, setRepeatItems] = useState<RepeatGradeItem[]>([]);
  const [dropoutTrend, setDropoutTrend] = useState<DropoutTrend[]>([]);

  const semesterParam = semester || undefined;

  const filteredDropoutItems = useMemo(
    () => dropoutItems.filter((item) => matchesGradeFilter(getGradeLabel(item), gradeFilter)),
    [dropoutItems, gradeFilter],
  );

  const filteredRiskItems = useMemo(
    () => riskItems.filter((item) => matchesGradeFilter(item.gradeLevel ?? "", gradeFilter)),
    [gradeFilter, riskItems],
  );

  const filteredRepeatItems = useMemo(
    () => repeatItems.filter((item) => item.academicYear === selectedYear && matchesGradeFilter(item.gradeLevelName ?? "", gradeFilter)),
    [gradeFilter, repeatItems, selectedYear],
  );

  const riskSummary = useMemo<RiskSummary | null>(() => {
    if (filteredRiskItems.length === 0) {
      return null;
    }

    let high = 0;
    let medium = 0;
    let watch = 0;
    let normal = 0;

    for (const item of filteredRiskItems) {
      if (item.riskLevel === "high") high += 1;
      else if (item.riskLevel === "medium") medium += 1;
      else if (item.riskLevel === "watch") watch += 1;
      else normal += 1;
    }

    const total = filteredRiskItems.length;

    return {
      academicYear: selectedYear,
      semester: semesterParam,
      high,
      medium,
      watch,
      neverAbsent: 0,
      total,
      totalRisk: high + medium,
      totalRiskIncludeWatch: high + medium + watch,
      normal,
    };
  }, [filteredRiskItems, selectedYear, semesterParam]);

  // Derived counts
  const dropoutsCount = filteredDropoutItems.length;
  const repeatersCount = filteredRepeatItems.length;
  const atRiskCount = riskSummary?.totalRiskIncludeWatch || 0;
  const completenessCount = 0; // Backend not available yet

  const handleSelectKpi = (id: string) => {
    if (KPI_ROUTES[id]) router.push(KPI_ROUTES[id]);
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const trendYears = Array.from({ length: 6 }, (_, index) => String(Number(selectedYear) - 5 + index));

        const getDropoutByYearAndSemester = async (year: string) => {
          if (semesterParam) {
            return dashBoardService.getDropoutList({ academicYear: year, semester: semesterParam });
          }
          const [s1, s2] = await Promise.all([
            dashBoardService.getDropoutList({ academicYear: year, semester: "1" }),
            dashBoardService.getDropoutList({ academicYear: year, semester: "2" }),
          ]);
          return [...s1, ...s2];
        };

        const getRiskByYearAndSemester = async (year: string) => {
          if (semesterParam) {
            return dashBoardService.getRiskStudentsFlat({ academicYear: year, semester: semesterParam });
          }
          const [s1, s2] = await Promise.all([
            dashBoardService.getRiskStudentsFlat({ academicYear: year, semester: "1" }),
            dashBoardService.getRiskStudentsFlat({ academicYear: year, semester: "2" }),
          ]);
          return [...s1, ...s2];
        };

        const [dropoutList, riskList, repeatData, trendCounts] = await Promise.all([
          getDropoutByYearAndSemester(selectedYear),
          getRiskByYearAndSemester(selectedYear),
          repeatService.getAll(),
          Promise.all(
            trendYears.map(async (year) => {
              const list = await getDropoutByYearAndSemester(year);
              return {
                year,
                dropout: list.filter((item) => matchesGradeFilter(getGradeLabel(item), gradeFilter)).length,
              };
            }),
          ),
        ]);

        setDropoutItems(dropoutList as DashboardDropoutItem[]);
        setRiskItems(riskList);
        setRepeatItems(repeatData);
        setDropoutTrend(trendCounts);

      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [gradeFilter, selectedYear, semesterParam]);

  return (
    <div className="dashboard-main">
      <div className="dashboard-page active" id="page-overview">
        {/* Filter Bar */}
        <div className="dashboard-filter-bar">
          <span className="dashboard-filter-lbl">กรอง:</span>
          <span className="dashboard-filter-lbl">ปีการศึกษา:</span>
          <select
            className="dashboard-lselect"
            value={selectedYear}
            onChange={e => setSelectedYear(e.target.value)}
          >
            {[2564, 2565, 2566,2567].map((y) => (
              <option key={y} value={String(y)}>{y}</option>
            ))}
          </select>
          <span className="dashboard-filter-lbl">ภาคเรียน:</span>
          <select
            className="dashboard-lselect"
            value={semester}
            onChange={e => setSemester(e.target.value)}
          >
            <option value="">ทั้งปี</option>
            <option value="1">1</option>
            <option value="2">2</option>
          </select>
          <span className="dashboard-filter-lbl">ระดับชั้น:</span>
          <select
            className="dashboard-lselect"
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value as GradeFilter)}
          >
            <option value="all">ทุกระดับชั้น</option>
            <option value="primary">ประถมศึกษา</option>
            <option value="secondary">มัธยมศึกษา</option>
            <option value="university">มหาลัย</option>
          </select>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0', color: 'var(--text-m)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: "spin 1s linear infinite", marginRight: 10 }}>
              <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
            กำลังโหลดข้อมูล...
            <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
          </div>
        ) : (
          <>
            {/* Row 1: KPIs */}
            <KpiGrid
              onSelectKpi={handleSelectKpi}
              dropoutsCount={dropoutsCount}
              repeatersCount={repeatersCount}
              atRiskCount={atRiskCount}
              completenessCount={completenessCount}
            />

            {/* Row 2: Donut + Gradient Line Chart */}
            <div className="dashboard-bento" style={{ marginBottom: "14px" }}>
              <RadialRingChart
                dropoutsCount={dropoutsCount}
                repeatersCount={repeatersCount}
                atRiskCount={atRiskCount}
              />
              <StackedBarGlowChart trendData={dropoutTrend} />
            </div>

            {/* Row 3: Risk Map */}
            <div className="dashboard-bento" style={{ marginBottom: "14px" }}>
              <RiskMap riskSummary={riskSummary} />
            </div>


          </>
        )}
      </div>
    </div>
  );
}
