"use client";

import React, { useEffect, useState } from "react";
import { APIProvider, Map as GoogleMap, AdvancedMarker, useMap, useApiIsLoaded } from "@vis.gl/react-google-maps";
import { dashBoardService } from "../../../lib/services/dashBoardService";
import { useProvince } from "../../context/ProvinceContext";
import { useTablePagination, TablePagination } from "../../components/TablePagination";
import { DroppedOutStudent, DropoutMapItem, DropoutDistrictMapItem } from "../../../lib/types/dashboardTypes";


function exportCSV(droppedOutStudents: DroppedOutStudent[]) {
  const headers = [
    "รหัสนักเรียน",
    "ชื่อ",
    "โรงเรียน",
    "ชั้น",
    "จังหวัด",
    "วันที่พบล่าสุด",
    "เหตุผลจัดกลุ่ม",
    "รายละเอียด",
    "สถานะช่วยเหลือ",
  ];
  const rows = droppedOutStudents.map((s: DroppedOutStudent) => [
    s.studentId,
    s.name,
    s.school,
    s.grade,
    s.province,
    s.lastSeen,
    s.groupedReason,
    s.detail,
    s.supportStatus,
  ]);
  const csv = [headers, ...rows]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((r: any[]) =>
      r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","),
    )
    .join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "dropped-out-students.csv";
  a.click();
  URL.revokeObjectURL(url);
}

type SupportStatus = "new" | "monitoring" | "resolved";
const STATUS_MAP: Record<SupportStatus, { cls: string; lbl: string }> = {
  new: {
    cls: "dashboard-badge dashboard-b-rose",
    lbl: "ยังไม่เปิดแผนช่วยเหลือ",
  },
  monitoring: { cls: "dashboard-badge dashboard-b-amber", lbl: "กำลังติดตาม" },
  resolved: { cls: "dashboard-badge dashboard-b-mint", lbl: "ช่วยเหลือแล้ว" },
};

const STATUS_PRIORITY: Record<SupportStatus, number> = {
  new: 1,
  monitoring: 2,
  resolved: 3,
};

const YEAR_OPTIONS = [2564, 2565, 2566, 2567];
const DONUT_PALETTE = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
];

function getReasonColor(label: string, index: number) {
  if (REASON_COLORS[label]) {
    return REASON_COLORS[label];
  }

  return DONUT_PALETTE[index % DONUT_PALETTE.length];
}

export default function DroppedOutStudentsPage() {
  const { selectedYear, selectedSemester, setSelectedYear, setSelectedSemester } = useProvince();
  const [dataList, setDataList] = useState<DroppedOutStudent[]>([]);
  const [mapData, setMapData] = useState<DropoutMapItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchList = async () => {
      setLoading(true);
      try {
        const [summary, mapResult] = await Promise.all([
          dashBoardService.getDropoutSummary({
            academicYear: selectedYear,
            semester: selectedSemester
          }),
          dashBoardService.getDropoutMap({
            academicYear: selectedYear,
            semester: selectedSemester
          }),
        ]);
        const mappedList: DroppedOutStudent[] = (summary.dropoutList ?? []).map((item) => ({
          studentId: String(item.student_id || item.id || "-"),
          name: `รหัส ${item.student_id || "-"}`,
          school: item.school_id ? `โรงเรียน #${item.school_id}` : "-",
          grade: item.gradeLevel_id ? `ชั้น #${item.gradeLevel_id}` : "-",
          province: "-",
          lastSeen: item.academicYear ? `ปี ${item.academicYear} ภาค ${item.semester}` : "-",
          groupedReason: item.dropoutReason ?? "ไม่ทราบสาเหตุ",
          detail: item.academicYear ? `${item.academicYear}/${item.semester}` : "-",
          supportStatus: "new",
        }));
        setDataList(mappedList);
        setMapData(mapResult);
      } catch (e) {
        console.error("Failed to fetch dropout list:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchList();
  }, [selectedYear, selectedSemester]);

  const fDropouts = [...dataList].sort((a, b) => {
    const prioA = STATUS_PRIORITY[a.supportStatus as SupportStatus] || 99;
    const prioB = STATUS_PRIORITY[b.supportStatus as SupportStatus] || 99;
    return prioA - prioB;
  });

  const total = fDropouts.length;
  const newCnt = fDropouts.filter(
    (s: DroppedOutStudent) => s.supportStatus === "new",
  ).length;
  const monitoringCnt = fDropouts.filter(
    (s: DroppedOutStudent) => s.supportStatus === "monitoring",
  ).length;
  const resolvedCnt = fDropouts.filter(
    (s: DroppedOutStudent) => s.supportStatus === "resolved",
  ).length;

  return (
    <div className="dashboard-main">
      <div className="dashboard-page active">


        {/* Top Header Section */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div className="dashboard-sec-title">จัดการข้อมูลนักเรียนหลุดออกจากระบบ</div>
            <div className="dashboard-sec-sub">ข้อมูลประจำปีการศึกษา {selectedYear} | ภาคเรียน {selectedSemester} | สรุปผลจากโมดูลจัดเก็บระบบ Dropout</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
              <span style={{ fontSize: 13, color: "var(--text-m)", fontWeight: 500 }}>ปีการศึกษา:</span>
              <select className="dashboard-lselect" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} style={{ minWidth: 130 }}>
                {YEAR_OPTIONS.map((year) => <option key={year} value={String(year)}>{year}</option>)}
              </select>
              <span style={{ fontSize: 13, color: "var(--text-m)", fontWeight: 500 }}>ภาคเรียน:</span>
              <select className="dashboard-lselect" value={selectedSemester} onChange={(e) => setSelectedSemester(e.target.value)} style={{ minWidth: 110 }}>
                <option value="1">1</option>
                <option value="2">2</option>
              </select>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", justifyContent: "flex-end" }}>
            {/* <button className="btn btn-ghost" onClick={() => exportCSV(fDropouts)} style={{ borderColor: "var(--dashboard-pager-border)" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
              Export CSV
            </button> */}
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0', color: 'var(--text-m)' }}>กำลังโหลดข้อมูล...</div>
        ) : (
          <>
            {/* ── Stat Cards ── */}
            <div className="dashboard-bento" style={{ marginBottom: "14px" }}>
              <div className="dashboard-card dashboard-kpi-card">
                <div
                  className="dashboard-kpi-icon"
                  style={{
                    background: "rgba(232,69,122,.10)",
                    border: "1px solid rgba(232,69,122,.18)",
                    color: "var(--rose)",
                  }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                </div>
                <div className="dashboard-kpi-num" style={{ color: "var(--rose)" }}>
                  {total}
                </div>
                <div className="dashboard-kpi-lbl">รายการทั้งหมด</div>
                <span className="dashboard-kpi-trend dashboard-t-up">
                  ▲ 
                </span>
              </div>
              <div className="dashboard-card dashboard-kpi-card">
                <div
                  className="dashboard-kpi-icon"
                  style={{
                    background: "rgba(232,69,122,.10)",
                    border: "1px solid rgba(232,69,122,.18)",
                    color: "var(--rose)",
                  }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="16" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                  </svg>
                </div>
                <div className="dashboard-kpi-num" style={{ color: "var(--rose)" }}>
                  {newCnt}
                </div>
                <div className="dashboard-kpi-lbl">ยังไม่เปิดแผนช่วยเหลือ</div>
                <span className="dashboard-kpi-trend dashboard-t-up">
                  ต้องดำเนินการด่วน
                </span>
              </div>
              <div className="dashboard-card dashboard-kpi-card">
                <div
                  className="dashboard-kpi-icon"
                  style={{
                    background: "rgba(217,119,6,.10)",
                    border: "1px solid rgba(217,119,6,.18)",
                    color: "var(--amber)",
                  }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </div>
                <div className="dashboard-kpi-num" style={{ color: "var(--amber)" }}>
                  {monitoringCnt}
                </div>
                <div className="dashboard-kpi-lbl">กำลังติดตาม</div>
                <span className="dashboard-kpi-trend dashboard-t-flat">
                  ≈ อยู่ระหว่างดำเนินการ
                </span>
              </div>
              <div className="dashboard-card dashboard-kpi-card">
                <div
                  className="dashboard-kpi-icon"
                  style={{
                    background: "rgba(26,170,136,.10)",
                    border: "1px solid rgba(26,170,136,.18)",
                    color: "var(--mint)",
                  }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
                <div className="dashboard-kpi-num" style={{ color: "var(--mint)" }}>
                  {resolvedCnt}
                </div>
                <div className="dashboard-kpi-lbl">ช่วยเหลือแล้ว</div>
                <span className="dashboard-kpi-trend dashboard-t-down">
                  ▼ อัตราสำเร็จดี
                </span>
              </div>
            </div>

            {/* ── Map Section ── */}
            <DropoutMap mapData={mapData} />

            {/* ── Grouped Reason Donut + Paginated Urgent Cases ── */}
            <MiddleSection fDropouts={fDropouts} newCnt={newCnt} />

            {/* ── Full Table ── */}
            <DroppedOutTable data={fDropouts} />
          </>
        )}
      </div>
    </div>
  );
}

/* ─────────── Thai Province Coordinates ─────────── */
const PROVINCE_COORDS: Record<string, { lat: number; lng: number }> = {
  "กรุงเทพมหานคร": { lat: 13.7563, lng: 100.5018 },
  "กระบี่": { lat: 8.0863, lng: 98.9063 },
  "กาญจนบุรี": { lat: 14.0043, lng: 99.5483 },
  "กาฬสินธุ์": { lat: 16.4322, lng: 103.5065 },
  "กำแพงเพชร": { lat: 16.4827, lng: 99.5226 },
  "ขอนแก่น": { lat: 16.4419, lng: 102.8360 },
  "จันทบุรี": { lat: 12.6113, lng: 102.1043 },
  "ฉะเชิงเทรา": { lat: 13.6904, lng: 101.0780 },
  "ชลบุรี": { lat: 13.3611, lng: 100.9847 },
  "ชัยนาท": { lat: 15.1851, lng: 100.1251 },
  "ชัยภูมิ": { lat: 15.8068, lng: 102.0316 },
  "ชุมพร": { lat: 10.4930, lng: 99.1800 },
  "เชียงราย": { lat: 19.9105, lng: 99.8406 },
  "เชียงใหม่": { lat: 18.7883, lng: 98.9853 },
  "ตรัง": { lat: 7.5563, lng: 99.6114 },
  "ตราด": { lat: 12.2428, lng: 102.5177 },
  "ตาก": { lat: 16.8840, lng: 99.1258 },
  "นครนายก": { lat: 14.2069, lng: 101.2133 },
  "นครปฐม": { lat: 13.8196, lng: 100.0643 },
  "นครพนม": { lat: 17.3920, lng: 104.7695 },
  "นครราชสีมา": { lat: 14.9799, lng: 102.0978 },
  "นครศรีธรรมราช": { lat: 8.4304, lng: 99.9631 },
  "นครสวรรค์": { lat: 15.7030, lng: 100.1371 },
  "นนทบุรี": { lat: 13.8591, lng: 100.5217 },
  "นราธิวาส": { lat: 6.4254, lng: 101.8253 },
  "น่าน": { lat: 18.7756, lng: 100.7730 },
  "บึงกาฬ": { lat: 18.3609, lng: 103.6464 },
  "บุรีรัมย์": { lat: 14.9930, lng: 103.1029 },
  "ปทุมธานี": { lat: 14.0208, lng: 100.5250 },
  "ประจวบคีรีขันธ์": { lat: 11.8126, lng: 99.7976 },
  "ปราจีนบุรี": { lat: 14.0509, lng: 101.3714 },
  "ปัตตานี": { lat: 6.8698, lng: 101.2501 },
  "พระนครศรีอยุธยา": { lat: 14.3532, lng: 100.5684 },
  "พะเยา": { lat: 19.1664, lng: 99.9019 },
  "พังงา": { lat: 8.4509, lng: 98.5225 },
  "พัทลุง": { lat: 7.6167, lng: 100.0740 },
  "พิจิตร": { lat: 16.4429, lng: 100.3487 },
  "พิษณุโลก": { lat: 16.8211, lng: 100.2659 },
  "เพชรบุรี": { lat: 13.1112, lng: 99.9391 },
  "เพชรบูรณ์": { lat: 16.4190, lng: 101.1591 },
  "แพร่": { lat: 18.1445, lng: 100.1403 },
  "ภูเก็ต": { lat: 7.8804, lng: 98.3923 },
  "มหาสารคาม": { lat: 16.1851, lng: 103.3008 },
  "มุกดาหาร": { lat: 16.5425, lng: 104.7235 },
  "แม่ฮ่องสอน": { lat: 19.3020, lng: 97.9654 },
  "ยโสธร": { lat: 15.7944, lng: 104.1452 },
  "ยะลา": { lat: 6.5407, lng: 101.2816 },
  "ร้อยเอ็ด": { lat: 16.0538, lng: 103.6520 },
  "ระนอง": { lat: 9.9529, lng: 98.6085 },
  "ระยอง": { lat: 12.6814, lng: 101.2816 },
  "ราชบุรี": { lat: 13.5283, lng: 99.8134 },
  "ลพบุรี": { lat: 14.7995, lng: 100.6534 },
  "ลำปาง": { lat: 18.2888, lng: 99.4908 },
  "ลำพูน": { lat: 18.5744, lng: 99.0087 },
  "เลย": { lat: 17.4860, lng: 101.7223 },
  "ศรีสะเกษ": { lat: 15.1186, lng: 104.3220 },
  "สกลนคร": { lat: 17.1545, lng: 104.1348 },
  "สงขลา": { lat: 7.1896, lng: 100.5945 },
  "สตูล": { lat: 6.6238, lng: 100.0673 },
  "สมุทรปราการ": { lat: 13.5991, lng: 100.5998 },
  "สมุทรสงคราม": { lat: 13.4098, lng: 100.0024 },
  "สมุทรสาคร": { lat: 13.5475, lng: 100.2747 },
  "สระแก้ว": { lat: 13.8240, lng: 102.0645 },
  "สระบุรี": { lat: 14.5289, lng: 100.9101 },
  "สิงห์บุรี": { lat: 14.8936, lng: 100.3967 },
  "สุโขทัย": { lat: 17.0078, lng: 99.8265 },
  "สุพรรณบุรี": { lat: 14.4744, lng: 100.1177 },
  "สุราษฎร์ธานี": { lat: 9.1382, lng: 99.3217 },
  "สุรินทร์": { lat: 14.8818, lng: 103.4937 },
  "หนองคาย": { lat: 17.8783, lng: 102.7420 },
  "หนองบัวลำภู": { lat: 17.2218, lng: 102.4260 },
  "อ่างทอง": { lat: 14.5896, lng: 100.4549 },
  "อำนาจเจริญ": { lat: 15.8656, lng: 104.6257 },
  "อุดรธานี": { lat: 17.4138, lng: 102.7872 },
  "อุตรดิตถ์": { lat: 17.6200, lng: 100.0993 },
  "อุทัยธานี": { lat: 15.3835, lng: 100.0245 },
  "อุบลราชธานี": { lat: 15.2287, lng: 104.8564 },
};

// Module-level geocode cache: key = "province::district"
const _geocodeCache = new globalThis.Map<string, { lat: number; lng: number }>();

/* ─────────── Geocode Helper (inside APIProvider) ─────────── */
function GeocodeHelper({
  districts,
  province,
  onDone,
}: {
  districts: string[];
  province: string;
  onDone: (coords: Record<string, { lat: number; lng: number }>) => void;
}) {
  const isLoaded = useApiIsLoaded();
  const onDoneRef = React.useRef(onDone);
  onDoneRef.current = onDone;

  React.useEffect(() => {
    if (!isLoaded || !districts.length || !province) return;

    // แยก districts ที่มี cache แล้ว vs ที่ต้อง geocode
    const cached: Record<string, { lat: number; lng: number }> = {};
    const needFetch: string[] = [];
    for (const name of districts) {
      const hit = _geocodeCache.get(`${province}::${name}`);
      if (hit) cached[name] = hit;
      else needFetch.push(name);
    }

    // ถ้า cache ครบทุก district ส่งผลทันที
    if (needFetch.length === 0) {
      onDoneRef.current({ ...cached });
      return;
    }

    const geocoder = new google.maps.Geocoder();
    const result: Record<string, { lat: number; lng: number }> = { ...cached };
    let remaining = needFetch.length;

    needFetch.forEach((name) => {
      geocoder.geocode(
        { address: `อำเภอ${name} จังหวัด${province} ประเทศไทย`, region: "TH" },
        (res, status) => {
          if (status === "OK" && res?.[0]) {
            const loc = res[0].geometry.location;
            const coords = { lat: loc.lat(), lng: loc.lng() };
            result[name] = coords;
            _geocodeCache.set(`${province}::${name}`, coords); // บันทึก cache
          }
          remaining--;
          if (remaining === 0) onDoneRef.current({ ...result });
        },
      );
    });
  }, [isLoaded, districts, province]);

  return null;
}

/* ─────────── Thai province name → English (apisit/thailand.json) ─────────── */
const PROVINCE_EN: Record<string, string> = {
  "กรุงเทพมหานคร": "Bangkok", "กระบี่": "Krabi", "กาญจนบุรี": "Kanchanaburi",
  "กาฬสินธุ์": "Kalasin", "กำแพงเพชร": "Kamphaeng Phet", "ขอนแก่น": "Khon Kaen",
  "จันทบุรี": "Chanthaburi", "ฉะเชิงเทรา": "Chachoengsao", "ชลบุรี": "Chon Buri",
  "ชัยนาท": "Chai Nat", "ชัยภูมิ": "Chaiyaphum", "ชุมพร": "Chumphon",
  "เชียงราย": "Chiang Rai", "เชียงใหม่": "Chiang Mai", "ตรัง": "Trang",
  "ตราด": "Trat", "ตาก": "Tak", "นครนายก": "Nakhon Nayok",
  "นครปฐม": "Nakhon Pathom", "นครพนม": "Nakhon Phanom", "นครราชสีมา": "Nakhon Ratchasima",
  "นครศรีธรรมราช": "Nakhon Si Thammarat", "นครสวรรค์": "Nakhon Sawan", "นนทบุรี": "Nonthaburi",
  "นราธิวาส": "Narathiwat", "น่าน": "Nan", "บึงกาฬ": "Bueng Kan",
  "บุรีรัมย์": "Buri Ram", "ปทุมธานี": "Pathum Thani", "ประจวบคีรีขันธ์": "Prachuap Khiri Khan",
  "ปราจีนบุรี": "Prachin Buri", "ปัตตานี": "Pattani", "พระนครศรีอยุธยา": "Phra Nakhon Si Ayutthaya",
  "พะเยา": "Phayao", "พังงา": "Phangnga", "พัทลุง": "Phatthalung",
  "พิจิตร": "Phichit", "พิษณุโลก": "Phitsanulok", "เพชรบุรี": "Phetchaburi",
  "เพชรบูรณ์": "Phetchabun", "แพร่": "Phrae", "ภูเก็ต": "Phuket",
  "มหาสารคาม": "Maha Sarakham", "มุกดาหาร": "Mukdahan", "แม่ฮ่องสอน": "Mae Hong Son",
  "ยโสธร": "Yasothon", "ยะลา": "Yala", "ร้อยเอ็ด": "Roi Et",
  "ระนอง": "Ranong", "ระยอง": "Rayong", "ราชบุรี": "Ratchaburi",
  "ลพบุรี": "Lop Buri", "ลำปาง": "Lampang", "ลำพูน": "Lamphun",
  "เลย": "Loei", "ศรีสะเกษ": "Si Sa Ket", "สกลนคร": "Sakon Nakhon",
  "สงขลา": "Songkhla", "สตูล": "Satun", "สมุทรปราการ": "Samut Prakan",
  "สมุทรสงคราม": "Samut Songkhram", "สมุทรสาคร": "Samut Sakhon", "สระแก้ว": "Sa Kaeo",
  "สระบุรี": "Saraburi", "สิงห์บุรี": "Sing Buri", "สุโขทัย": "Sukhothai",
  "สุพรรณบุรี": "Suphan Buri", "สุราษฎร์ธานี": "Surat Thani", "สุรินทร์": "Surin",
  "หนองคาย": "Nong Khai", "หนองบัวลำภู": "Nong Bua Lam Phu", "อ่างทอง": "Ang Thong",
  "อำนาจเจริญ": "Amnat Charoen", "อุดรธานี": "Udon Thani", "อุตรดิตถ์": "Uttaradit",
  "อุทัยธานี": "Uthai Thani", "อุบลราชธานี": "Ubon Ratchathani",
};

// Module-level cache so GeoJSON is fetched at most once per session
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _geoJsonCache: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function loadThailandGeoJson(): Promise<any> {
  if (_geoJsonCache) return _geoJsonCache;
  const res = await fetch("/thailand.json"); // serve จาก /public แทน GitHub
  _geoJsonCache = await res.json();
  return _geoJsonCache;
}

function extendBoundsFromGeometry(
  bounds: google.maps.LatLngBounds,
  geometry: { type: string; coordinates: unknown },
) {
  const walk = (coords: unknown) => {
    if (!Array.isArray(coords)) return;
    if (
      coords.length >= 2 &&
      typeof coords[0] === "number" &&
      typeof coords[1] === "number"
    ) {
      const lng = coords[0] as number;
      const lat = coords[1] as number;
      bounds.extend({ lat, lng });
      return;
    }
    coords.forEach(walk);
  };

  walk(geometry.coordinates);
}

/* ─────────── Province Boundary Highlight (inside GoogleMap) ─────────── */
function ProvinceHighlight({ province }: { province: string | null }) {
  const map = useMap();

  React.useEffect(() => {
    if (!map) return;

    // Clear any previous highlight
    const toRemove: google.maps.Data.Feature[] = [];
    map.data.forEach((f) => toRemove.push(f));
    toRemove.forEach((f) => map.data.remove(f));

    if (!province) return;

    const engName = PROVINCE_EN[province];
    if (!engName) return;

    let cancelled = false;
    loadThailandGeoJson().then((geojson) => {
      if (cancelled || !map) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const features = geojson.features.filter((f: any) => {
        const name: string = f.properties?.name ?? "";
        return name.toLowerCase() === engName.toLowerCase();
      });
      if (!features.length) return;

      const provinceBounds = new google.maps.LatLngBounds();
      features.forEach((feature: { geometry?: { type: string; coordinates: unknown } }) => {
        if (feature?.geometry) {
          extendBoundsFromGeometry(provinceBounds, feature.geometry);
        }
      });

      if (!provinceBounds.isEmpty()) map.fitBounds(provinceBounds, 40);

      map.data.addGeoJson({ type: "FeatureCollection", features });
      map.data.setStyle({
        fillColor: "#f59e0b",
        fillOpacity: 0.1,
        strokeColor: "#fbbf24",
        strokeWeight: 3,
        strokeOpacity: 1,
        zIndex: 2,
      });
    });

    return () => {
      cancelled = true;
      const toRemove2: google.maps.Data.Feature[] = [];
      map.data.forEach((f) => toRemove2.push(f));
      toRemove2.forEach((f) => map.data.remove(f));
    };
  }, [map, province]);

  return null;
}

/* ─────────── Dropout Map Component ─────────── */
function DropoutMapCircles({ markers }: { markers: { lat: number; lng: number; radius: number; color: string }[] }) {
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
        fillOpacity: 0.22,
        strokeColor: m.color,
        strokeOpacity: 0.5,
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

function getHeatColor(count: number, maxCount: number): string {
  const ratio = maxCount > 0 ? count / maxCount : 0;
  if (ratio > 0.7) return "#dc2626";
  if (ratio > 0.4) return "#f97316";
  if (ratio > 0.2) return "#eab308";
  return "#22c55e";
}

function DropoutMap({ mapData }: { mapData: DropoutMapItem[] }) {
  const { selectedYear, selectedSemester } = useProvince();
  const [filterProvince, setFilterProvince] = useState<string | null>(null);
  const [filterDistrict, setFilterDistrict] = useState<string | null>(null);
  const [districtData, setDistrictData] = useState<DropoutDistrictMapItem[]>([]);
  const [districtCoords, setDistrictCoords] = useState<Record<string, { lat: number; lng: number }>>({});
  const [loadingDistrict, setLoadingDistrict] = useState(false);
  const [selectedItem, setSelectedItem] = useState<DropoutMapItem | DropoutDistrictMapItem | null>(null);

  const provinces = [...mapData].filter((d) => d.province !== "ไม่ระบุ").sort((a, b) => b.count - a.count);

  React.useEffect(() => {
    if (!filterProvince) {
      setDistrictData([]);
      setDistrictCoords({});
      setFilterDistrict(null);
      setSelectedItem(null);
      return;
    }
    setLoadingDistrict(true);
    setDistrictCoords({});
    dashBoardService
      .getDropoutMapDistrict({ academicYear: selectedYear, semester: selectedSemester, province: filterProvince })
      .then((data) => setDistrictData(data))
      .catch(() => setDistrictData([]))
      .finally(() => setLoadingDistrict(false));
  }, [filterProvince, selectedYear, selectedSemester]);

  const isDistrictView = filterProvince !== null;

  const maxProvinceCount = Math.max(...mapData.map((d) => d.count), 1);
  const provinceMarkers = mapData
    .filter((d) => d.province !== "ไม่ระบุ" && PROVINCE_COORDS[d.province])
    .map((d) => {
      const coords = PROVINCE_COORDS[d.province];
      const color = getHeatColor(d.count, maxProvinceCount);
      const radius = 15000 + (d.count / maxProvinceCount) * 45000;
      return { ...d, ...coords, color, radius };
    });

  const maxDistrictCount = Math.max(...districtData.map((d) => d.count), 1);
  const visibleDistrictData = filterDistrict ? districtData.filter((d) => d.district === filterDistrict) : districtData;

  // สร้าง fallback coords เป็นวงกลมรอบจุดกลางจังหวัด กรณี geocoding ยังไม่เสร็จ
  const provCenter = filterProvince ? PROVINCE_COORDS[filterProvince] : null;
  const fallbackDistrictCoords = React.useMemo(() => {
    if (!provCenter) return {};
    const validDistricts = visibleDistrictData.filter((d) => d.district !== "ไม่ระบุ");
    const result: Record<string, { lat: number; lng: number }> = {};
    const count = validDistricts.length;
    if (count === 0) return result;
    const radiusDeg = count === 1 ? 0 : 0.15; // ~15km spread
    validDistricts.forEach((d, i) => {
      const angle = (2 * Math.PI * i) / count - Math.PI / 2;
      result[d.district] = {
        lat: provCenter.lat + radiusDeg * Math.sin(angle),
        lng: provCenter.lng + radiusDeg * Math.cos(angle),
      };
    });
    return result;
  }, [provCenter, visibleDistrictData]);

  const districtMarkers = visibleDistrictData
    .filter((d) => d.district !== "ไม่ระบุ")
    .map((d) => {
      // ใช้ geocoded coords ถ้ามี ถ้าไม่มีใช้ fallback
      const coords = districtCoords[d.district] || fallbackDistrictCoords[d.district];
      if (!coords) return null;
      const color = getHeatColor(d.count, maxDistrictCount);
      const radius = 5000 + (d.count / maxDistrictCount) * 20000;
      return { ...d, ...coords, color, radius };
    })
    .filter(Boolean) as (DropoutDistrictMapItem & { lat: number; lng: number; color: string; radius: number })[];

  const districtNamesToGeocode = districtData
    .filter((d) => d.district !== "ไม่ระบุ" && !districtCoords[d.district])
    .map((d) => d.district);

  const activeMarkers = isDistrictView ? districtMarkers : provinceMarkers;
  const provinceCenterCoords = filterProvince ? PROVINCE_COORDS[filterProvince] : null;
  const centerLat = provinceCenterCoords
    ? provinceCenterCoords.lat
    : activeMarkers.length > 0
    ? activeMarkers.reduce((sum, m) => sum + m.lat, 0) / activeMarkers.length
    : 13.0;
  const centerLng = provinceCenterCoords
    ? provinceCenterCoords.lng
    : activeMarkers.length > 0
    ? activeMarkers.reduce((sum, m) => sum + m.lng, 0) / activeMarkers.length
    : 101.0;

  const defaultZoom = filterProvince ? 9 : activeMarkers.length === 1 ? 9 : 5.8;

  if (mapData.length === 0) return null;

  return (
    <div className="dashboard-card dashboard-b4" style={{ marginBottom: "14px" }}>
      <div className="dashboard-sec-hdr" style={{ marginBottom: 14 }}>
        <div>
          <div className="dashboard-sec-title">แผนที่พื้นที่เด็กหลุดออกจากระบบ</div>
          <div className="dashboard-sec-sub">
            {isDistrictView
              ? `แสดงเขต/อำเภอใน${filterProvince} — วงกลมยิ่งใหญ่ยิ่งมีจำนวนมาก`
              : "แสดงการกระจายตัวของนักเรียนหลุดออกจากระบบตามจังหวัด — วงกลมยิ่งใหญ่ยิ่งมีจำนวนมาก"}
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div style={{ display: "flex", gap: 10, marginBottom: 14, alignItems: "center", flexWrap: "wrap" }}>
        <select
          className="dashboard-lselect"
          value={filterProvince ?? ""}
          onChange={(e) => { setFilterProvince(e.target.value || null); setFilterDistrict(null); }}
          style={{ minWidth: 160 }}
        >
          <option value="">ทุกจังหวัด</option>
          {provinces.map((p) => (
            <option key={p.province} value={p.province}>{p.province} ({p.count})</option>
          ))}
        </select>

        {filterProvince && (
          <select
            className="dashboard-lselect"
            value={filterDistrict ?? ""}
            onChange={(e) => setFilterDistrict(e.target.value || null)}
            disabled={loadingDistrict}
            style={{ minWidth: 180, opacity: loadingDistrict ? 0.6 : 1 }}
          >
            <option value="">ทุกเขต/อำเภอ</option>
            {[...districtData].sort((a, b) => b.count - a.count).map((d) => (
              <option key={d.district} value={d.district}>{d.district} ({d.count})</option>
            ))}
          </select>
        )}

        {filterProvince && (
          <button
            onClick={() => { setFilterProvince(null); setFilterDistrict(null); }}
            style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid rgba(239,68,68,.3)", background: "rgba(239,68,68,.06)", color: "#dc2626", fontSize: 12, fontWeight: 500, cursor: "pointer" }}
          >
            ล้างตัวกรอง
          </button>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16 }}>
        {/* Map */}
        <div style={{ position: "relative" }}>
          <div style={{ width: "100%", height: "clamp(520px, 72vh, 760px)", borderRadius: 14, overflow: "hidden", border: "1px solid rgba(0,0,0,.08)" }}>
            <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""}>
              {filterProvince && districtNamesToGeocode.length > 0 && (
                <GeocodeHelper
                  districts={districtNamesToGeocode}
                  province={filterProvince}
                  onDone={(coords) => setDistrictCoords((prev) => ({ ...prev, ...coords }))}
                />
              )}
              <GoogleMap
                key={`${filterProvince ?? "all"}-${filterDistrict ?? "all"}`}
                defaultCenter={{ lat: centerLat, lng: centerLng }}
                defaultZoom={defaultZoom}
                gestureHandling="cooperative"
                disableDefaultUI
                zoomControl
                mapId="dropout-map"
                style={{ width: "100%", height: "100%" }}
              >
                <ProvinceHighlight province={filterProvince} />
                <DropoutMapCircles
                  markers={activeMarkers.map((m) => ({ lat: m.lat, lng: m.lng, radius: m.radius, color: m.color }))}
                />
                {/* Province markers */}
                {!isDistrictView && provinceMarkers.map((marker) => (
                  <AdvancedMarker
                    key={marker.province}
                    position={{ lat: marker.lat, lng: marker.lng }}
                    onClick={() => {
                      setFilterProvince(marker.province);
                      setFilterDistrict(null);
                      setSelectedItem(marker);
                    }}
                  >
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer" }}>
                      <div style={{ background: "white", borderRadius: 8, padding: "4px 8px", boxShadow: "0 2px 8px rgba(0,0,0,.18)", border: `2px solid ${marker.color}`, fontSize: 11, fontWeight: 700, color: marker.color, whiteSpace: "nowrap", marginBottom: 4, lineHeight: 1.3, textAlign: "center" }}>
                        <div>{marker.province}</div>
                        <div style={{ fontSize: 10, fontWeight: 500, color: "var(--text-m, #6b7280)" }}>{marker.count} คน</div>
                      </div>
                      <div style={{ width: 14, height: 14, borderRadius: "50%", background: marker.color, border: "2.5px solid white", boxShadow: `0 0 0 3px ${marker.color}33, 0 2px 6px rgba(0,0,0,.2)` }} />
                    </div>
                  </AdvancedMarker>
                ))}
                {/* District markers */}
                {isDistrictView && districtMarkers.map((marker) => (
                  <AdvancedMarker
                    key={`${marker.province}-${marker.district}`}
                    position={{ lat: marker.lat, lng: marker.lng }}
                    onClick={() => setSelectedItem(marker)}
                  >
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer" }}>
                      <div style={{ background: "white", borderRadius: 8, padding: "4px 8px", boxShadow: "0 2px 8px rgba(0,0,0,.18)", border: `2px solid ${marker.color}`, fontSize: 11, fontWeight: 700, color: marker.color, whiteSpace: "nowrap", marginBottom: 4, lineHeight: 1.3, textAlign: "center" }}>
                        <div>{marker.district}</div>
                        <div style={{ fontSize: 10, fontWeight: 500, color: "var(--text-m, #6b7280)" }}>{marker.count} คน</div>
                      </div>
                      <div style={{ width: 14, height: 14, borderRadius: "50%", background: marker.color, border: "2.5px solid white", boxShadow: `0 0 0 3px ${marker.color}33, 0 2px 6px rgba(0,0,0,.2)` }} />
                    </div>
                  </AdvancedMarker>
                ))}
              </GoogleMap>
            </APIProvider>
          </div>

          {/* Loading overlay */}
          {isDistrictView && loadingDistrict && (
            <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,.65)", backdropFilter: "blur(2px)", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 14 }}>
              <div style={{ fontSize: 13, color: "var(--text-m, #6b7280)", fontWeight: 500 }}>กำลังโหลดข้อมูลเขต...</div>
            </div>
          )}
          {/* Geocoding indicator */}
          {isDistrictView && !loadingDistrict && districtNamesToGeocode.length > 0 && (
            <div style={{ position: "absolute", top: 8, left: "50%", transform: "translateX(-50%)", background: "rgba(255,255,255,.9)", borderRadius: 8, padding: "4px 12px", fontSize: 11, color: "var(--text-m)", boxShadow: "0 1px 4px rgba(0,0,0,.1)" }}>
              กำลังระบุตำแหน่งเขต...
            </div>
          )}

          {/* Legend */}
          <div style={{ position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)", background: "rgba(255,255,255,.92)", backdropFilter: "blur(6px)", borderRadius: 10, padding: "6px 14px", boxShadow: "0 2px 8px rgba(0,0,0,.1)", display: "flex", gap: 12, fontSize: 11, fontWeight: 500 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}><div style={{ width: 10, height: 10, borderRadius: "50%", background: "#dc2626" }} /> มาก</div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}><div style={{ width: 10, height: 10, borderRadius: "50%", background: "#f97316" }} /> สูง</div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}><div style={{ width: 10, height: 10, borderRadius: "50%", background: "#eab308" }} /> ปานกลาง</div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}><div style={{ width: 10, height: 10, borderRadius: "50%", background: "#22c55e" }} /> น้อย</div>
          </div>
        </div>

        {/* Sidebar: Ranking + Detail */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-m)", textTransform: "uppercase", letterSpacing: ".8px", marginBottom: 10 }}>
              {isDistrictView ? `เขต/อำเภอใน${filterProvince}` : "อันดับจังหวัดเด็กหลุดสูงสุด"}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {(isDistrictView ? districtData : provinces as (DropoutDistrictMapItem | DropoutMapItem)[]).slice(0, 7).map((d, i) => {
                const maxCnt = isDistrictView ? maxDistrictCount : maxProvinceCount;
                const label: string = "district" in d ? (d as DropoutDistrictMapItem).district : (d as DropoutMapItem).province;
                const color = getHeatColor(d.count, maxCnt);
                const barW = `${Math.round((d.count / maxCnt) * 100)}%`;
                const isSelected = selectedItem
                  ? "district" in selectedItem
                    ? "district" in d && (selectedItem as DropoutDistrictMapItem).district === (d as DropoutDistrictMapItem).district
                    : !("district" in d) && (selectedItem as DropoutMapItem).province === (d as DropoutMapItem).province
                  : false;
                return (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 8, background: isSelected ? "rgba(239,68,68,.06)" : "transparent", cursor: "pointer", transition: "background .15s" }} onClick={() => {
                        if (!isDistrictView && "province" in d) {
                          setFilterProvince((d as DropoutMapItem).province);
                          setFilterDistrict(null);
                        } else {
                          setSelectedItem(d);
                        }
                      }}>
                    <div style={{ width: 22, height: 22, borderRadius: 6, background: color + "18", color, fontSize: 11, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{i + 1}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-h, #111827)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</div>
                      <div style={{ height: 5, borderRadius: 3, background: "var(--dashboard-progress-track, #e5e7eb)", marginTop: 3, overflow: "hidden" }}>
                        <div style={{ height: "100%", borderRadius: 3, width: barW, background: color, transition: "width .6s" }} />
                      </div>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color }}>{d.count}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected item detail */}
          {selectedItem && (
            <div style={{ background: "var(--dashboard-card-soft-bg, #f9fafb)", border: "1px solid var(--dashboard-card-soft-border, #e5e7eb)", borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-h, #111827)", marginBottom: 8 }}>
                {"district" in selectedItem ? selectedItem.district : (selectedItem as DropoutMapItem).province}
                <span style={{ fontWeight: 500, color: "var(--text-m, #6b7280)", marginLeft: 6, fontSize: 12 }}>({selectedItem.count} คน)</span>
              </div>
              <div style={{ fontSize: 11, color: "var(--text-m, #6b7280)", marginBottom: 6 }}>สาเหตุการหลุด:</div>
              {[...selectedItem.reasons].sort((a, b) => b.count - a.count).map((r) => (
                <div key={r.reason} style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, padding: "3px 0" }}>
                  <span style={{ color: "var(--text-h, #374151)" }}>{r.reason}</span>
                  <span style={{ fontWeight: 600, color: "var(--text-m, #6b7280)" }}>{r.count}</span>
                </div>
              ))}
            </div>
          )}

          {/* Summary stats */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div style={{ background: "rgba(239,68,68,.06)", border: "1px solid rgba(239,68,68,.16)", borderRadius: 10, padding: 10, textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#dc2626" }}>
                {isDistrictView
                  ? districtData.filter((d) => d.district !== "ไม่ระบุ").length
                  : mapData.filter((d) => d.province !== "ไม่ระบุ").length}
              </div>
              <div style={{ fontSize: 10.5, color: "var(--text-m)", marginTop: 2 }}>{isDistrictView ? "เขต/อำเภอที่พบ" : "จังหวัดที่พบ"}</div>
            </div>
            <div style={{ background: "rgba(234,179,8,.06)", border: "1px solid rgba(234,179,8,.18)", borderRadius: 10, padding: 10, textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#b45309" }}>
                {isDistrictView
                  ? districtData.reduce((sum, d) => sum + d.count, 0)
                  : mapData.reduce((sum, d) => sum + d.count, 0)}
              </div>
              <div style={{ fontSize: 10.5, color: "var(--text-m)", marginTop: 2 }}>เด็กหลุดทั้งหมด</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────── Middle Section: Donut + Paginated Urgent ─────────── */
const REASON_COLORS: Record<string, string> = {
  "เศรษฐกิจ / ความยากจน": "#ef4444",
  "ย้ายถิ่นฐาน": "#f97316",
  "ปัญหาครอบครัว": "#eab308",
  "สุขภาพ / ความพิการ": "#8b5cf6",
  "ไม่ทราบสาเหตุ": "#64748b",
};

function MiddleSection({
  fDropouts,
  newCnt,
}: {
  fDropouts: DroppedOutStudent[];
  newCnt: number;
}) {
  const ITEMS_PER_PAGE = 3;
  const urgentList = fDropouts.filter((s) => s.supportStatus === "new");
  const totalPages = Math.max(1, Math.ceil(urgentList.length / ITEMS_PER_PAGE));
  const [page, setPage] = useState<number>(0);

  const prev = () => setPage((p: number) => Math.max(0, p - 1));
  const next = () => setPage((p: number) => Math.min(totalPages - 1, p + 1));
  const pageItems = urgentList.slice(
    page * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE + ITEMS_PER_PAGE,
  );

  // ── Compute reason stats from real data ──
  const reasonMap = new Map<string, number>();
  fDropouts.forEach((s) => {
    const r = s.groupedReason || "ไม่ทราบสาเหตุ";
    reasonMap.set(r, (reasonMap.get(r) || 0) + 1);
  });
  const reasonArr = Array.from(reasonMap.entries())
    .map(([label, count], index) => ({
      label,
      count,
      color: getReasonColor(label, index),
      pct: fDropouts.length > 0 ? Math.round((count / fDropouts.length) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  // ── Mini donut ──
  const R = 40, CX = 52, CY = 52;
  const CIRC = 2 * Math.PI * R;
  const GAP = 3;
  const arcs = reasonArr.reduce((acc, seg, idx) => {
    let offset = CIRC / 4;
    for (let i = 0; i < idx; i++) {
      offset += fDropouts.length > 0 ? (reasonArr[i].count / fDropouts.length) * CIRC : 0;
    }
    const len = fDropouts.length > 0 ? (seg.count / fDropouts.length) * CIRC - GAP : 0;
    const dashOffset = CIRC - offset;
    acc.push({ ...seg, len: Math.max(len, 0), dashOffset });
    return acc;
  }, [] as Array<typeof reasonArr[number] & { len: number; dashOffset: number }>);

  return (
    <div
      className="dashboard-bento"
      style={{ marginBottom: "14px", gridTemplateColumns: "1fr 1fr" }}
    >
      {/* ── LEFT: Donut + Reasons ── */}
      <div
        className="dashboard-card"
        style={{
          background: "var(--dashboard-grad-red)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", top: -30, right: -30, width: 100, height: 100, borderRadius: "50%", background: "rgba(239,68,68,.06)", filter: "blur(18px)", pointerEvents: "none" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(239,68,68,.10)", display: "flex", alignItems: "center", justifyContent: "center", color: "#ef4444" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" /></svg>
          </div>
          <div className="dashboard-sec-title" style={{ margin: 0 }}>สัดส่วนตามเหตุผลจัดกลุ่ม</div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ flexShrink: 0 }}>
            <svg viewBox="0 0 104 104" style={{ width: 110, height: 110 }}>
              <circle cx={CX} cy={CY} r={R} fill="none" stroke="var(--dashboard-progress-track)" strokeWidth={16} />
              {arcs.map((arc) => (
                <circle key={arc.label} cx={CX} cy={CY} r={R} fill="none" stroke={arc.color} strokeWidth={16}
                  strokeDasharray={`${arc.len} ${CIRC}`} strokeDashoffset={arc.dashOffset} strokeLinecap="butt"
                  style={{ transition: "stroke-dasharray .8s cubic-bezier(.4,0,.2,1), stroke-dashoffset .8s cubic-bezier(.4,0,.2,1)" }}
                />
              ))}
              <text x={CX} y={CY - 4} textAnchor="middle" fontSize={16} fontWeight={800} fill="var(--text-h, #111827)">{fDropouts.length}</text>
              <text x={CX} y={CY + 10} textAnchor="middle" fontSize={8} fill="var(--text-m, #6b7280)">คนทั้งหมด</text>
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            {reasonArr.map((r) => (
              <div key={r.label} style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, fontWeight: 500, marginBottom: 3 }}>
                  <span style={{ color: "var(--text-h, #374151)" }}>{r.label}</span>
                  <span style={{ color: r.color, fontWeight: 700 }}>{r.count} ({r.pct}%)</span>
                </div>
                <div style={{ height: 7, borderRadius: 4, background: "var(--dashboard-progress-track)", overflow: "hidden" }}>
                  <div style={{ height: "100%", borderRadius: 4, width: `${r.pct}%`, background: `linear-gradient(90deg, ${r.color}cc, ${r.color})`, transition: "width 1s cubic-bezier(.4,0,.2,1)" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT: Paginated Urgent Cases ── */}
      <div className="dashboard-card" style={{ background: "var(--dashboard-grad-amber)", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", bottom: -25, left: -25, width: 90, height: 90, borderRadius: "50%", background: "rgba(245,158,11,.07)", filter: "blur(16px)", pointerEvents: "none" }} />

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(245,158,11,.10)", display: "flex", alignItems: "center", justifyContent: "center", color: "#f59e0b" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <div className="dashboard-sec-title" style={{ margin: 0 }}>ประเด็นเร่งด่วน</div>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", background: newCnt > 0 ? "#ef4444" : "#94a3b8", borderRadius: 10, padding: "1px 8px", marginLeft: 4, animation: newCnt > 0 ? "pulse-badge 2s infinite" : "none" }}>{newCnt}</span>
          </div>

          {urgentList.length > ITEMS_PER_PAGE && (
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              <button onClick={prev} disabled={page === 0} style={{ width: 28, height: 28, borderRadius: 8, border: "1px solid var(--dashboard-pager-border)", background: page === 0 ? "var(--dashboard-pager-bg-disabled)" : "var(--dashboard-pager-bg)", cursor: page === 0 ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: page === 0 ? 0.35 : 1, transition: "all .15s" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
              </button>
              <span style={{ fontSize: 10.5, color: "var(--text-m, #9ca3af)", fontWeight: 600, minWidth: 36, textAlign: "center" }}>{page + 1}/{totalPages}</span>
              <button onClick={next} disabled={page >= totalPages - 1} style={{ width: 28, height: 28, borderRadius: 8, border: "1px solid var(--dashboard-pager-border)", background: page >= totalPages - 1 ? "var(--dashboard-pager-bg-disabled)" : "var(--dashboard-pager-bg)", cursor: page >= totalPages - 1 ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: page >= totalPages - 1 ? 0.35 : 1, transition: "all .15s" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
              </button>
            </div>
          )}
        </div>

        {/* Case cards */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
          {newCnt === 0 ? (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-m, #9ca3af)", fontSize: 13 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6 }}><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
              ไม่มีเคสที่รอดำเนินการ
            </div>
          ) : (
            pageItems.map((s, idx) => (
              <div key={s.studentId} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, background: "var(--dashboard-card-soft-bg)", border: "1px solid var(--dashboard-card-soft-border)", backdropFilter: "blur(4px)", animation: `fadeSlideIn .35s ${idx * 60}ms both` }}>
                <div style={{ flexShrink: 0, position: "relative", width: 10, height: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444", position: "absolute", top: 1, left: 1 }} />
                  <div style={{ width: 10, height: 10, borderRadius: "50%", border: "2px solid rgba(239,68,68,.3)", position: "absolute", top: -1, left: -1, animation: "ping-dot 1.5s infinite" }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 12.5, color: "var(--text-h, #111827)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</div>
                  <div style={{ fontSize: 10.5, color: "var(--text-m, #6b7280)", marginTop: 1 }}>{s.school} · {s.province}</div>
                  <div style={{ fontSize: 10, color: "var(--text-m, #9ca3af)", marginTop: 2 }}>เหตุผล: {s.groupedReason}</div>
                </div>
                <button
                  style={{ flexShrink: 0, fontSize: 10.5, fontWeight: 600, padding: "4px 10px", borderRadius: 6, border: "none", background: "linear-gradient(135deg, #ef4444, #dc2626)", color: "#fff", cursor: "pointer", transition: "transform .15s, box-shadow .15s", boxShadow: "0 2px 6px rgba(239,68,68,.25)" }}
                  onMouseOver={(e) => { e.currentTarget.style.transform = "scale(1.05)"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(239,68,68,.35)"; }}
                  onMouseOut={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 2px 6px rgba(239,68,68,.25)"; }}
                  onClick={() => window.alert(`เปิดเคสติดตาม: ${s.name}`)}
                >
                  เปิดเคส
                </button>
              </div>
            ))
          )}
        </div>

        {/* Pagination dots */}
        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", gap: 5, marginTop: 12 }}>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button key={i} onClick={() => setPage(i)} style={{ width: page === i ? 18 : 7, height: 7, borderRadius: 4, border: "none", background: page === i ? "#ef4444" : "var(--dashboard-dot-inactive)", cursor: "pointer", transition: "all .3s cubic-bezier(.4,0,.2,1)" }} />
            ))}
          </div>
        )}

        <style>{`
          @keyframes fadeSlideIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes ping-dot { 0% { transform: scale(1); opacity: 1; } 75% { transform: scale(1.8); opacity: 0; } 100% { transform: scale(1.8); opacity: 0; } }
          @keyframes pulse-badge { 0%, 100% { opacity: 1; } 50% { opacity: .65; } }
        `}</style>
      </div>
    </div>
  );
}

/* ─────────── Paginated Table ─────────── */
const PER_PAGE = 8;

function DroppedOutTable({ data }: { data: DroppedOutStudent[] }) {
  const { page, totalPages, pageData, setPage } = useTablePagination(data, PER_PAGE);

  return (
    <div className="dashboard-card dashboard-b4" style={{ marginBottom: "14px" }}>
      <div className="dashboard-sec-hdr" style={{ marginBottom: 14 }}>
        <div>
          <div className="dashboard-sec-title">รายชื่อนักเรียนทั้งหมด</div>
          <div className="dashboard-sec-sub">
            เจาะรายชื่อสำหรับผู้บริหารและเขตพื้นที่ใช้ติดตามเชิงลึก
            ครอบคลุมเหตุผลจัดกลุ่มและสถานะการช่วยเหลือ
          </div>
        </div>
      </div>
      <div className="dashboard-ltable-wrap">
        <table className="dashboard-ltable">
          <thead>
            <tr>
              <th>นักเรียน</th>
              <th>โรงเรียน / จังหวัด</th>
              <th>เหตุผลที่ถูกจัดกลุ่ม</th>
              <th>รายละเอียด</th>
              <th>วันที่พบล่าสุด</th>
              <th>สถานะ</th>
            </tr>
          </thead>
          <tbody>
            {pageData.map((s) => {
              const st = STATUS_MAP[s.supportStatus as SupportStatus] ?? STATUS_MAP.new;
              return (
                <tr key={s.studentId}>
                  <td>
                    <div className="dashboard-tc-name">{s.name}</div>
                    <div className="dashboard-tc-sub">{s.studentId} · ชั้น {s.grade}</div>
                  </td>
                  <td>
                    <div>{s.school}</div>
                    <div className="dashboard-tc-sub">{s.province}</div>
                  </td>
                  <td>{s.groupedReason}</td>
                  <td style={{ maxWidth: "240px", whiteSpace: "normal", lineHeight: 1.5 }}>{s.detail}</td>
                  <td style={{ whiteSpace: "nowrap" }}>{s.lastSeen}</td>
                  <td><span className={st.cls}>{st.lbl}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <TablePagination page={page} totalPages={totalPages} setPage={setPage} totalItems={data.length} perPage={PER_PAGE} />
    </div>
  );
}
