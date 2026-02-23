// src/FilterPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

type Province = { id: number; name: string };
type Regency = { id: number; name: string; province_id: number };
type District = { id: number; name: string; regency_id: number };

type RegionData = {
  provinces: Province[];
  regencies: Regency[];
  districts: District[];
};

const LS_KEY = "filter_wilayah_v1";

function readLS(): { province?: string; regency?: string; district?: string } | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as any) : null;
  } catch {
    return null;
  }
}

function writeLS(payload: { province: string; regency: string; district: string }) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(payload));
  } catch {}
}

function clearLS() {
  try {
    localStorage.removeItem(LS_KEY);
  } catch {}
}

function toIntOrNull(v: string | null): number | null {
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function getNameById<T extends { id: number; name: string }>(list: T[], id: number | null) {
  if (!id) return "";
  return list.find((x) => x.id === id)?.name ?? "";
}

function IconChevronDown() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
      <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
    </svg>
  );
}

function IconArrowDown() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4 text-slate-300"
      fill="none"
      stroke="currentColor"
    >
      <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 5v14" />
      <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="m19 12-7 7-7-7" />
    </svg>
  );
}

function IconReset() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
      <path
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 12a9 9 0 1 1-2.64-6.36"
      />
      <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M21 3v6h-6" />
    </svg>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] font-semibold tracking-[0.18em] text-slate-400">
      {children}
    </div>
  );
}

function SelectRow({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
        {icon}
      </div>
      <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
        <IconChevronDown />
      </div>
      {children}
    </div>
  );
}

function IconMap() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
      <path
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 18 3 21V6l6-3 6 3 6-3v15l-6 3-6-3Z"
      />
      <path strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M9 3v15" />
      <path strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M15 6v15" />
    </svg>
  );
}

function IconPin() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
      <path
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 21s7-4.6 7-11a7 7 0 1 0-14 0c0 6.4 7 11 7 11Z"
      />
      <path strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M12 10.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
    </svg>
  );
}

export default function FilterPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [data, setData] = useState<RegionData | null>(null);
  const [loading, setLoading] = useState(true);

  const provinceId = toIntOrNull(searchParams.get("province"));
  const regencyId = toIntOrNull(searchParams.get("regency"));
  const districtId = toIntOrNull(searchParams.get("district"));

  // 1) load JSON
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        const res = await fetch("/data/indonesia_regions.json");
        if (!res.ok) throw new Error(`Failed fetch: ${res.status}`);
        const json = (await res.json()) as RegionData;
        if (!alive) return;
        setData(json);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  // 2) restore on refresh if URL empty
  useEffect(() => {
    const hasAny = !!(provinceId || regencyId || districtId);
    if (hasAny) return;

    const saved = readLS();
    const sp = toIntOrNull(saved?.province ?? null);
    const sr = toIntOrNull(saved?.regency ?? null);
    const sd = toIntOrNull(saved?.district ?? null);

    if (sp || sr || sd) {
      const next = new URLSearchParams();
      if (sp) next.set("province", String(sp));
      if (sr) next.set("regency", String(sr));
      if (sd) next.set("district", String(sd));
      setSearchParams(next, { replace: true });
    }
  }, [provinceId, regencyId, districtId, setSearchParams]);

  // 3) persist current filter
  useEffect(() => {
    writeLS({
      province: searchParams.get("province") || "",
      regency: searchParams.get("regency") || "",
      district: searchParams.get("district") || "",
    });
  }, [searchParams]);

  const { regencyOptions, districtOptions, breadcrumb } = useMemo(() => {
    const empty = {
      regencyOptions: [] as Regency[],
      districtOptions: [] as District[],
      breadcrumb: { provinceName: "", regencyName: "", districtName: "" },
    };

    if (!data) return empty;

    // validate chain
    let p = provinceId;
    let r = regencyId;
    let d = districtId;

    if (r) {
      const ok = data.regencies.some((x) => x.id === r && x.province_id === p);
      if (!ok) {
        r = null;
        d = null;
      }
    }

    if (d) {
      const ok = data.districts.some((x) => x.id === d && x.regency_id === r);
      if (!ok) d = null;
    }

    const regOpts = p ? data.regencies.filter((x) => x.province_id === p) : [];
    const disOpts = r ? data.districts.filter((x) => x.regency_id === r) : [];

    const bc = {
      provinceName: getNameById(data.provinces, p),
      regencyName: getNameById(data.regencies, r),
      districtName: getNameById(data.districts, d),
    };

    return { regencyOptions: regOpts, districtOptions: disOpts, breadcrumb: bc };
  }, [data, provinceId, regencyId, districtId]);

  function setParams(p: number | null, r: number | null, d: number | null) {
    const next = new URLSearchParams();
    if (p) next.set("province", String(p));
    if (r) next.set("regency", String(r));
    if (d) next.set("district", String(d));
    setSearchParams(next);
  }

  function onProvinceChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = toIntOrNull(e.target.value);
    setParams(val, null, null);
  }

  function onRegencyChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = toIntOrNull(e.target.value);
    setParams(provinceId, val, null);
  }

  function onDistrictChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = toIntOrNull(e.target.value);
    setParams(provinceId, regencyId, val);
  }

  function onReset() {
    clearLS();
    navigate("/");
  }

  const parts = ["Indonesia", breadcrumb.provinceName, breadcrumb.regencyName, breadcrumb.districtName].filter(
    Boolean
  );

  const titleProvince = breadcrumb.provinceName || "-";
  const titleRegency = breadcrumb.regencyName || "-";
  const titleDistrict = breadcrumb.districtName || "-";

  if (loading) {
    return <div className="min-h-screen w-full p-10 text-slate-600">Loading...</div>;
  }

  if (!data) {
    return (
      <div className="min-h-screen w-full p-10 text-slate-600">
        Gagal memuat data. Pastikan file ada di <code>public/data/indonesia_regions.json</code>.
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-white">
      <div className="flex min-h-screen w-full">
        {/* Sidebar */}
        <aside className="w-[320px] shrink-0 border-r border-slate-200 bg-slate-50/60 px-6 py-6">
          <div className="text-base font-semibold text-slate-900">Frontend Assessment</div>

          <div className="mt-10">
            <div className="text-[10px] font-semibold tracking-[0.2em] text-slate-400">
              FILTER WILAYAH
            </div>

            <div className="mt-6 space-y-6">
              {/* Provinsi */}
              <div>
                <div className="mb-2 text-xs font-semibold tracking-wide text-slate-500">
                  PROVINSI
                </div>
                <SelectRow icon={<IconMap />}>
                  <select
                    name="province"
                    value={provinceId ?? ""}
                    onChange={onProvinceChange}
                    className="w-full appearance-none rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-10 text-sm font-medium text-slate-800 shadow-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  >
                    <option value="">Pilih Provinsi</option>
                    {data.provinces.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </SelectRow>
              </div>

              {/* Kota/Kab */}
              <div>
                <div className="mb-2 text-xs font-semibold tracking-wide text-slate-500">
                  KOTA/KABUPATEN
                </div>
                <SelectRow icon={<IconMap />}>
                  <select
                    name="regency"
                    value={regencyId ?? ""}
                    onChange={onRegencyChange}
                    disabled={!provinceId}
                    className="w-full appearance-none rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-10 text-sm font-medium text-slate-800 shadow-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    <option value="">
                      {provinceId ? "Pilih Kota/Kabupaten" : "Pilih Provinsi dulu"}
                    </option>
                    {regencyOptions.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </SelectRow>
              </div>

              {/* Kecamatan */}
              <div>
                <div className="mb-2 text-xs font-semibold tracking-wide text-slate-500">
                  KECAMATAN
                </div>
                <SelectRow icon={<IconPin />}>
                  <select
                    name="district"
                    value={districtId ?? ""}
                    onChange={onDistrictChange}
                    disabled={!regencyId}
                    className="w-full appearance-none rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-10 text-sm font-medium text-slate-800 shadow-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    <option value="">
                      {regencyId ? "Pilih Kecamatan" : "Pilih Kota/Kabupaten dulu"}
                    </option>
                    {districtOptions.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </SelectRow>
              </div>

              {/* Reset */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onReset}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-blue-300 bg-white px-4 py-3 text-xs font-semibold tracking-widest text-slate-700 shadow-sm outline-none hover:bg-blue-50 focus:ring-4 focus:ring-blue-100"
                >
                  <IconReset />
                  RESET
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Right side: breadcrumb + main */}
        <section className="flex min-w-0 flex-1 flex-col bg-white">
          <div className="border-b border-slate-200 bg-white px-8 py-5">
            <div className="breadcrumb text-xs font-medium text-slate-400">
              {parts.map((p, idx) => (
                <span key={`${p}-${idx}`}>
                  {idx > 0 ? <span className="mx-2 text-slate-300">›</span> : null}
                  <span className={idx === parts.length - 1 ? "text-blue-600" : ""}>
                    {p}
                  </span>
                </span>
              ))}
            </div>
          </div>

          <main className="flex flex-1 items-center justify-center px-8 py-10">
            <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
              <div className="mt-2">
                <FieldLabel>PROVINSI</FieldLabel>
                <div className="mt-3 text-5xl font-semibold leading-tight text-slate-900">
                  {titleProvince}
                </div>
              </div>

              <div className="my-10">
                <IconArrowDown />
              </div>

              <div>
                <FieldLabel>KOTA / KABUPATEN</FieldLabel>
                <div className="mt-3 text-4xl font-semibold leading-tight text-slate-900">
                  {titleRegency}
                </div>
              </div>

              <div className="my-10">
                <IconArrowDown />
              </div>

              <div>
                <FieldLabel>KECAMATAN</FieldLabel>
                <div className="mt-3 text-4xl font-semibold leading-tight text-slate-900">
                  {titleDistrict}
                </div>
              </div>
            </div>
          </main>
        </section>
      </div>
    </div>
  );
}