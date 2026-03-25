export interface MockStudent {
  id: string; // e.g. STU-2567-001
  studentName: string;
  citizenId: string;
  citizenIdFull: string;
  classroom: string;
  school: string;
  schoolId: string; // To match user.schoolId or user.area
  area: string; // Province
  status: "active" | "inactive" | "graduated";
  dob: string;
  age: string;
  gender: "ชาย" | "หญิง";
  bloodType: string;
  address: string;
  guardian: string;
  guardianPhone: string;
  enrollDate: string;
}

export const MOCK_STUDENTS: MockStudent[] = [
  {
    id: "STU-2567-001",
    studentName: "เด็กชายสมชาย ใจดี",
    citizenId: "1-10XX-XXXXX-XX-0",
    citizenIdFull: "1-1001-00001-00-0",
    classroom: "ม.2/3",
    school: "โรงเรียนวัดสุทธิวราราม",
    schoolId: "โรงเรียนวัดสุทธิวราราม", // using name as ID fallback if needed
    area: "กรุงเทพมหานคร",
    status: "active",
    dob: "15 มกราคม 2555",
    age: "14 ปี",
    gender: "ชาย",
    bloodType: "O",
    address: "123/45 ซ.สุขุมวิท 22 แขวงคลองตัน เขตคลองเตย กรุงเทพฯ 10110",
    guardian: "นายทองดี ใจดี (บิดา)",
    guardianPhone: "081-XXX-XXXX",
    enrollDate: "16 พ.ค. 2566",
  },
  {
    id: "STU-2567-002",
    studentName: "เด็กหญิงมาลี สวยสด",
    citizenId: "1-10XX-XXXXX-XX-1",
    citizenIdFull: "1-1002-00002-00-1",
    classroom: "ม.1/2",
    school: "โรงเรียน A",
    schoolId: "โรงเรียน A", // In real app, this should match user.schoolId logically if user is School Admin
    area: "เชียงใหม่",
    status: "active",
    dob: "20 กุมภาพันธ์ 2556",
    age: "13 ปี",
    gender: "หญิง",
    bloodType: "A",
    address: "45/6 หมู่ 2 ต.สุเทพ อ.เมือง จ.เชียงใหม่",
    guardian: "นางดวงตา สวยสด (มารดา)",
    guardianPhone: "089-XXX-XXXX",
    enrollDate: "16 พ.ค. 2567",
  },
  {
    id: "STU-2567-003",
    studentName: "เด็กชายวินัย รักชาติ",
    citizenId: "1-20XX-XXXXX-XX-2",
    citizenIdFull: "1-2003-00003-00-2",
    classroom: "ป.5/1",
    school: "โรงเรียน A",
    schoolId: "โรงเรียน A",
    area: "เชียงใหม่",
    status: "active",
    dob: "10 สิงหาคม 2557",
    age: "11 ปี",
    gender: "ชาย",
    bloodType: "B",
    address: "78 หมู่ 1 ต.แม่เหียะ อ.เมือง จ.เชียงใหม่",
    guardian: "นายวีระ รักชาติ (บิดา)",
    guardianPhone: "082-XXX-XXXX",
    enrollDate: "16 พ.ค. 2565",
  },
  {
    id: "STU-2567-004",
    studentName: "เด็กหญิงกนกวรรณ งามพร้อม",
    citizenId: "1-30XX-XXXXX-XX-3",
    citizenIdFull: "1-3004-00004-00-3",
    classroom: "ม.3/1",
    school: "โรงเรียนสวนกุหลาบ",
    schoolId: "โรงเรียนสวนกุหลาบ",
    area: "กรุงเทพมหานคร",
    status: "active",
    dob: "5 พฤศจิกายน 2554",
    age: "15 ปี",
    gender: "หญิง",
    bloodType: "AB",
    address: "89/12 ถนนพระราม 1 แขวงปทุมวัน เขตปทุมวัน กรุงเทพฯ 10330",
    guardian: "นางวิภา งามพร้อม (มารดา)",
    guardianPhone: "086-XXX-XXXX",
    enrollDate: "16 พ.ค. 2564",
  },
  // Add more as needed
];
