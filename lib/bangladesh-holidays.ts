export type BangladeshNationalHoliday = {
  date: string
  name: string
}

// Bangladesh government public holidays for 2026, based on the Ministry of Public
// Administration's annual holiday notice and later additional holiday orders.
export const BANGLADESH_NATIONAL_HOLIDAYS: readonly BangladeshNationalHoliday[] = [
  { date: '2026-02-04', name: 'Shab-e-Barat' },
  { date: '2026-02-21', name: 'Shaheed Day' },
  { date: '2026-03-17', name: 'Shab-e-Qadr' },
  { date: '2026-03-18', name: 'Eid-ul-Fitr' },
  { date: '2026-03-19', name: 'Eid-ul-Fitr' },
  { date: '2026-03-20', name: 'Eid-ul-Fitr' },
  { date: '2026-03-21', name: 'Eid-ul-Fitr' },
  { date: '2026-03-22', name: 'Eid-ul-Fitr' },
  { date: '2026-03-23', name: 'Eid-ul-Fitr' },
  { date: '2026-03-26', name: 'Independence Day' },
  { date: '2026-04-14', name: 'Pohela Boishakh' },
  { date: '2026-05-01', name: 'May Day & Buddha Purnima' },
  { date: '2026-05-25', name: 'Eid-ul-Adha' },
  { date: '2026-05-26', name: 'Eid-ul-Adha' },
  { date: '2026-05-27', name: 'Eid-ul-Adha' },
  { date: '2026-05-28', name: 'Eid-ul-Adha' },
  { date: '2026-05-29', name: 'Eid-ul-Adha' },
  { date: '2026-05-30', name: 'Eid-ul-Adha' },
  { date: '2026-05-31', name: 'Eid-ul-Adha' },
  { date: '2026-06-26', name: 'Ashura' },
  { date: '2026-08-05', name: 'July Mass Uprising Day' },
  { date: '2026-08-26', name: 'Eid-e-Miladunnabi' },
  { date: '2026-09-04', name: 'Janmashtami' },
  { date: '2026-10-20', name: 'Durga Puja' },
  { date: '2026-10-21', name: 'Vijaya Dashami' },
  { date: '2026-11-07', name: 'National Revolution & Solidarity Day' },
  { date: '2026-12-16', name: 'Victory Day' },
  { date: '2026-12-25', name: 'Christmas' },
]

export function getBangladeshNationalHoliday(date: Date | null): BangladeshNationalHoliday | null {
  if (!date) return null
  const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  return BANGLADESH_NATIONAL_HOLIDAYS.find((holiday) => holiday.date === key) ?? null
}
