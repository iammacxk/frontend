"use client";
import { createContext, useContext, useState, ReactNode } from "react";
type ProvinceContextType = {
  selectedProvince: string;
  setSelectedProvince: (province: string) => void;
  selectedYear: string;
  setSelectedYear: (year: string) => void;
  selectedSemester: string;
  setSelectedSemester: (semester: string) => void;
};
const ProvinceContext = createContext<ProvinceContextType | undefined>(
  undefined,
);
export function ProvinceProvider({ children }: { children: ReactNode }) {
  // "all" translates to everything, allowing the view to show every province or filter specific ones.
  const [selectedProvince, setSelectedProvince] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<string>("2567");
  const [selectedSemester, setSelectedSemester] = useState<string>("1");

  return (
    <ProvinceContext.Provider
      value={{
        selectedProvince,
        setSelectedProvince,
        selectedYear,
        setSelectedYear,
        selectedSemester,
        setSelectedSemester,
      }}
    >
      {children}
    </ProvinceContext.Provider>
  );
}
export function useProvince() {
  const context = useContext(ProvinceContext);
  if (context === undefined) {
    throw new Error("useProvince must be used within a ProvinceProvider");
  }
  return context;
}
