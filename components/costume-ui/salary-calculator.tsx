import React, { useState, useEffect } from 'react'
import { Calculator, Info, User, Users, Calendar } from 'lucide-react'
import InputGroup from './input-group'
import Input from './input'

// Types
type AgeCategory = 'under60' | '60-above'
type CitizenshipStatus = 'malaysian' | 'pr-before-1998' | 'foreign-after-1998'
type MaritalStatus = 'single' | 'married'

interface EPFRates {
  employee: number
  employer: number
}

interface ContributionAmount {
  employee: number
  employer: number
}

interface SOCSOBracket {
  min: number
  max: number
  employee: number
  employer: number
}

interface TaxBracket {
  limit: number
  rate: number
  base: number
}

interface Calculations {
  epf: ContributionAmount
  socso: ContributionAmount
  eis: ContributionAmount
  pcb: number
  totalEmployeeDeductions: number
  totalEmployerContributions: number
  netSalary: number
  grossSalary: number
}

// Malaysian Salary Calculator Component - 2025 Rules (Type-Safe)
const MalaysianSalaryCalculator: React.FC = () => {
  const [monthlySalary, setMonthlySalary] = useState<string>('')
  const [age, setAge] = useState<AgeCategory>('under60')
  const [citizenship, setCitizenship] = useState<CitizenshipStatus>('malaysian')
  const [maritalStatus, setMaritalStatus] = useState<MaritalStatus>('single')
  const [spouseWorking, setSpouseWorking] = useState<boolean>(false)
  const [numChildren, setNumChildren] = useState<number>(0)
  const [calculations, setCalculations] = useState<Calculations | null>(null)

  // EPF rates based on age and citizenship
  const getEPFRates = (
    age: AgeCategory,
    citizenship: CitizenshipStatus,
    salary: number
  ): EPFRates => {
    // Malaysian/PR or Non-Malaysian registered before 1 Aug 1998
    if (citizenship === 'malaysian' || citizenship === 'pr-before-1998') {
      if (age === 'under60') {
        const employerRate = salary <= 5000 ? 13 : 12
        return { employee: 11, employer: employerRate }
      } else if (age === '60-above') {
        return { employee: 0, employer: 4 } // Malaysian 60+
      }
    }

    // PR aged 60+
    if (citizenship === 'pr-before-1998' && age === '60-above') {
      const employerRate = salary <= 5000 ? 6.5 : 6
      return { employee: 5.5, employer: employerRate }
    }

    // Non-Malaysian registered from 1 Aug 1998 onwards
    if (citizenship === 'foreign-after-1998') {
      if (age === 'under60') {
        return { employee: 2, employer: 2 } // New 2025 mandate
      } else {
        return { employee: 5.5, employer: 0 }
      }
    }

    return { employee: 11, employer: 13 }
  }

  // SOCSO Contribution Table (Full 2025)
  const socsoTable: SOCSOBracket[] = [
    { min: 0, max: 30, employee: 0.1, employer: 0.4 },
    { min: 30, max: 50, employee: 0.2, employer: 0.8 },
    { min: 50, max: 70, employee: 0.3, employer: 1.2 },
    { min: 70, max: 100, employee: 0.4, employer: 1.6 },
    { min: 100, max: 140, employee: 0.6, employer: 2.4 },
    { min: 140, max: 200, employee: 0.85, employer: 3.4 },
    { min: 200, max: 300, employee: 1.25, employer: 5.0 },
    { min: 300, max: 400, employee: 1.75, employer: 7.0 },
    { min: 400, max: 500, employee: 2.25, employer: 9.0 },
    { min: 500, max: 600, employee: 2.75, employer: 11.0 },
    { min: 600, max: 700, employee: 3.25, employer: 13.0 },
    { min: 700, max: 800, employee: 3.75, employer: 15.0 },
    { min: 800, max: 900, employee: 4.25, employer: 17.0 },
    { min: 900, max: 1000, employee: 4.75, employer: 19.0 },
    { min: 1000, max: 1100, employee: 5.25, employer: 21.0 },
    { min: 1100, max: 1200, employee: 5.75, employer: 23.0 },
    { min: 1200, max: 1300, employee: 6.25, employer: 25.0 },
    { min: 1300, max: 1400, employee: 6.75, employer: 27.0 },
    { min: 1400, max: 1500, employee: 7.25, employer: 29.0 },
    { min: 1500, max: 1600, employee: 7.75, employer: 31.0 },
    { min: 1600, max: 1700, employee: 8.25, employer: 33.0 },
    { min: 1700, max: 1800, employee: 8.75, employer: 35.0 },
    { min: 1800, max: 1900, employee: 9.25, employer: 37.0 },
    { min: 1900, max: 2000, employee: 9.75, employer: 39.0 },
    { min: 2000, max: 2100, employee: 10.25, employer: 41.0 },
    { min: 2100, max: 2200, employee: 10.75, employer: 43.0 },
    { min: 2200, max: 2300, employee: 11.25, employer: 45.0 },
    { min: 2300, max: 2400, employee: 11.75, employer: 47.0 },
    { min: 2400, max: 2500, employee: 12.25, employer: 49.0 },
    { min: 2500, max: 2600, employee: 12.75, employer: 51.0 },
    { min: 2600, max: 2700, employee: 13.25, employer: 53.0 },
    { min: 2700, max: 2800, employee: 13.75, employer: 55.0 },
    { min: 2800, max: 2900, employee: 14.25, employer: 57.0 },
    { min: 2900, max: 3000, employee: 14.75, employer: 59.0 },
    { min: 3000, max: 3100, employee: 15.25, employer: 61.0 },
    { min: 3100, max: 3200, employee: 15.75, employer: 63.0 },
    { min: 3200, max: 3300, employee: 16.25, employer: 65.0 },
    { min: 3300, max: 3400, employee: 16.75, employer: 67.0 },
    { min: 3400, max: 3500, employee: 17.25, employer: 69.0 },
    { min: 3500, max: 3600, employee: 17.75, employer: 71.0 },
    { min: 3600, max: 3700, employee: 18.25, employer: 73.0 },
    { min: 3700, max: 3800, employee: 18.75, employer: 75.0 },
    { min: 3800, max: 3900, employee: 19.25, employer: 77.0 },
    { min: 3900, max: 4000, employee: 19.75, employer: 79.0 },
    { min: 4000, max: 4100, employee: 20.25, employer: 81.0 },
    { min: 4100, max: 4200, employee: 20.75, employer: 83.0 },
    { min: 4200, max: 4300, employee: 21.25, employer: 85.0 },
    { min: 4300, max: 4400, employee: 21.75, employer: 87.0 },
    { min: 4400, max: 4500, employee: 22.25, employer: 89.0 },
    { min: 4500, max: 4600, employee: 22.75, employer: 91.0 },
    { min: 4600, max: 4700, employee: 23.25, employer: 93.0 },
    { min: 4700, max: 4800, employee: 23.75, employer: 95.0 },
    { min: 4800, max: 4900, employee: 24.25, employer: 97.0 },
    { min: 4900, max: 5000, employee: 24.75, employer: 99.0 },
    { min: 5000, max: 5100, employee: 25.25, employer: 101.0 },
    { min: 5100, max: 5200, employee: 25.75, employer: 103.0 },
    { min: 5200, max: 5300, employee: 26.25, employer: 105.0 },
    { min: 5300, max: 5400, employee: 26.75, employer: 107.0 },
    { min: 5400, max: 5500, employee: 27.25, employer: 109.0 },
    { min: 5500, max: 5600, employee: 27.75, employer: 111.0 },
    { min: 5600, max: 5700, employee: 28.25, employer: 113.0 },
    { min: 5700, max: 5800, employee: 28.75, employer: 115.0 },
    { min: 5800, max: 5900, employee: 29.25, employer: 117.0 },
    { min: 5900, max: 6000, employee: 29.75, employer: 119.0 },
    { min: 6000, max: Infinity, employee: 30.25, employer: 121.0 }
  ]

  // Calculate SOCSO - Under 60: both schemes, 60+: Employment Injury only
  const calculateSOCSO = (
    salary: number,
    age: AgeCategory
  ): ContributionAmount => {
    const cappedSalary = Math.min(salary, 6000)
    const bracket = socsoTable.find(
      b => cappedSalary > b.min && cappedSalary <= b.max
    )

    if (!bracket) return { employee: 0, employer: 0 }

    if (age === 'under60') {
      // Both Employment Injury + Invalidity: 1.75% employer, 0.5% employee
      return { employee: bracket.employee, employer: bracket.employer }
    } else {
      // 60+: Employment Injury only: 1.25% employer, 0% employee
      return { employee: 0, employer: bracket.employer * 0.714 } // Approximate 1.25% vs 1.75%
    }
  }

  // Calculate EIS - Age 18-60 only, capped at RM6,000
  const calculateEIS = (
    salary: number,
    age: AgeCategory
  ): ContributionAmount => {
    if (age === '60-above') return { employee: 0, employer: 0 }

    const cappedSalary = Math.min(salary, 6000)
    const contribution = Math.round(cappedSalary * 0.002 * 100) / 100
    return { employee: contribution, employer: contribution }
  }

  // EPF Rounding - Round up to nearest RM1
  const roundEPF = (amount: number): number => {
    return Math.ceil(amount)
  }

  // Calculate EPF
  const calculateEPF = (
    salary: number,
    age: AgeCategory,
    citizenship: CitizenshipStatus
  ): ContributionAmount => {
    const rates = getEPFRates(age, citizenship, salary)

    if (salary <= 20000) {
      // Use EPF table (rounded amounts), simplified here as percentage
      const employeeContribution = roundEPF((salary * rates.employee) / 100)
      const employerContribution = roundEPF((salary * rates.employer) / 100)
      return { employee: employeeContribution, employer: employerContribution }
    } else {
      // Above RM20,000: exact percentage
      const employeeContribution =
        Math.round(((salary * rates.employee) / 100) * 100) / 100
      const employerContribution =
        Math.round(((salary * rates.employer) / 100) * 100) / 100
      return { employee: employeeContribution, employer: employerContribution }
    }
  }

  // Tax Relief Calculation
  const getTaxRelief = (
    maritalStatus: MaritalStatus,
    spouseWorking: boolean,
    numChildren: number
  ): number => {
    let relief = 9000 // Personal relief

    if (maritalStatus === 'married' && !spouseWorking) {
      relief += 4000 // Spouse relief
    }

    relief += numChildren * 2000 // Child relief RM2,000 per child

    return relief
  }

  // PCB Calculation (Simplified Progressive Tax 2025)
  const calculatePCB = (
    annualSalary: number,
    annualEPF: number,
    maritalStatus: MaritalStatus,
    spouseWorking: boolean,
    numChildren: number,
    citizenship: CitizenshipStatus
  ): number => {
    if (citizenship === 'foreign-after-1998') {
      // Non-residents: flat 30% on gross income (no reliefs)
      return (annualSalary * 0.3) / 12
    }

    // Resident tax calculation
    const taxRelief = getTaxRelief(maritalStatus, spouseWorking, numChildren)
    const chargeableIncome = Math.max(0, annualSalary - annualEPF - taxRelief)

    let tax = 0
    const brackets: TaxBracket[] = [
      { limit: 5000, rate: 0, base: 0 },
      { limit: 20000, rate: 0.01, base: 0 },
      { limit: 35000, rate: 0.03, base: 150 },
      { limit: 50000, rate: 0.06, base: 600 },
      { limit: 70000, rate: 0.11, base: 1500 },
      { limit: 100000, rate: 0.19, base: 3700 },
      { limit: 250000, rate: 0.25, base: 9400 },
      { limit: 400000, rate: 0.26, base: 46900 },
      { limit: 600000, rate: 0.28, base: 85900 },
      { limit: 1000000, rate: 0.3, base: 141900 },
      { limit: 2000000, rate: 0.32, base: 261900 },
      { limit: Infinity, rate: 0.34, base: 581900 }
    ]

    let remaining = chargeableIncome
    let prevLimit = 0

    for (const bracket of brackets) {
      if (remaining <= 0) break

      const taxableInBracket = Math.min(remaining, bracket.limit - prevLimit)
      tax += taxableInBracket * bracket.rate
      remaining -= taxableInBracket
      prevLimit = bracket.limit
    }

    return tax / 12 // Monthly PCB
  }

  // Main calculation
  useEffect(() => {
    if (monthlySalary && parseFloat(monthlySalary) > 0) {
      const salary = parseFloat(monthlySalary)

      const epf = calculateEPF(salary, age, citizenship)
      const socso = calculateSOCSO(salary, age)
      const eis = calculateEIS(salary, age)

      const annualSalary = salary * 12
      const annualEPFEmployee = epf.employee * 12
      const pcb = calculatePCB(
        annualSalary,
        annualEPFEmployee,
        maritalStatus,
        spouseWorking,
        numChildren,
        citizenship
      )

      const totalEmployeeDeductions =
        epf.employee + socso.employee + eis.employee + pcb
      const netSalary = salary - totalEmployeeDeductions

      setCalculations({
        epf,
        socso,
        eis,
        pcb,
        totalEmployeeDeductions,
        totalEmployerContributions:
          epf.employer + socso.employer + eis.employer,
        netSalary,
        grossSalary: salary
      })
    } else {
      setCalculations(null)
    }
  }, [
    monthlySalary,
    age,
    citizenship,
    maritalStatus,
    spouseWorking,
    numChildren
  ])

  const handleSalaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMonthlySalary(e.target.value)
  }

  const handleAgeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setAge(e.target.value as AgeCategory)
  }

  const handleCitizenshipChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCitizenship(e.target.value as CitizenshipStatus)
  }

  const handleMaritalStatusChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setMaritalStatus(e.target.value as MaritalStatus)
  }

  const handleSpouseWorkingChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setSpouseWorking(e.target.value === 'working')
  }

  const handleChildrenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNumChildren(Math.max(0, parseInt(e.target.value) || 0))
  }

  return (
    <div className='flex flex-col gap-5'>
      {/* Basic Information */}
      <div className='bg-white rounded-lg border border-border-default p-6'>
        <div className='flex items-center gap-2 mb-6'>
          <Calculator className='w-5 h-5 text-primary' />
          <h3 className='texts-heading-h3 text-text-primary'>
            Salary Calculator (2025)
          </h3>
        </div>

        <div className='grid grid-cols-2 gap-5'>
          <div className='flex flex-col gap-2'>
            <label className='texts-label-medium text-text-primary'>
              Monthly Salary <span className='text-error-main'>*</span>
            </label>
            <div className='relative'>
              <span className='absolute left-3 top-1/2 -translate-y-1/2 texts-body-medium text-text-secondary'>
                RM
              </span>
              <input
                type='number'
                value={monthlySalary}
                onChange={handleSalaryChange}
                placeholder='0.00'
                className='w-full pl-12 pr-3 py-2.5 border border-border-default rounded-lg texts-body-medium text-text-primary placeholder:text-text-placeholder focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary'
              />
            </div>
          </div>

          <div className='flex flex-col gap-2'>
            <label className='texts-label-medium text-text-primary flex items-center gap-1'>
              <Calendar className='w-4 h-4' />
              Age Category
            </label>
            <select
              value={age}
              onChange={handleAgeChange}
              className='w-full px-3 py-2.5 border border-border-default rounded-lg texts-body-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary'
            >
              <option value='under60'>Under 60</option>
              <option value='60-above'>60 and Above</option>
            </select>
          </div>

          <div className='flex flex-col gap-2'>
            <label className='texts-label-medium text-text-primary'>
              Citizenship Status
            </label>
            <select
              value={citizenship}
              onChange={handleCitizenshipChange}
              className='w-full px-3 py-2.5 border border-border-default rounded-lg texts-body-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary'
            >
              <option value='malaysian'>Malaysian / PR (before 1998)</option>
              <option value='pr-before-1998'>
                PR (registered before 1998)
              </option>
              <option value='foreign-after-1998'>
                Foreign (after 1 Aug 1998)
              </option>
            </select>
          </div>

          <div className='flex flex-col gap-2'>
            <label className='texts-label-medium text-text-primary flex items-center gap-1'>
              <User className='w-4 h-4' />
              Marital Status
            </label>
            <select
              value={maritalStatus}
              onChange={handleMaritalStatusChange}
              className='w-full px-3 py-2.5 border border-border-default rounded-lg texts-body-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary'
            >
              <option value='single'>Single</option>
              <option value='married'>Married</option>
            </select>
          </div>

          {maritalStatus === 'married' && (
            <div className='flex flex-col gap-2'>
              <label className='texts-label-medium text-text-primary'>
                Spouse Working Status
              </label>
              <select
                value={spouseWorking ? 'working' : 'not-working'}
                onChange={handleSpouseWorkingChange}
                className='w-full px-3 py-2.5 border border-border-default rounded-lg texts-body-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary'
              >
                <option value='not-working'>Spouse Not Working</option>
                <option value='working'>Spouse Working</option>
              </select>
            </div>
          )}

          <div className='flex flex-col gap-2'>
            <InputGroup label='Number of Children'>
              <Input
                type='number'
                value={numChildren}
                onChange={handleChildrenChange}
                min='0'
              />
            </InputGroup>
          </div>
        </div>
      </div>

      {/* Results */}
      {calculations && (
        <div className='bg-white rounded-lg border border-border-default overflow-hidden'>
          <div className='p-6 border-b border-border-default'>
            <h3 className='texts-heading-h3 text-text-primary'>
              Deduction Summary
            </h3>
            <p className='texts-body-small text-text-secondary mt-1'>
              Monthly statutory contributions breakdown
            </p>
          </div>

          <div className='overflow-x-auto'>
            <table className='w-full'>
              <thead className='bg-background-secondary'>
                <tr>
                  <th className='px-6 py-3 text-left texts-table-header text-text-primary'>
                    Deduction
                  </th>
                  <th className='px-6 py-3 text-right texts-table-header text-text-primary'>
                    Employer (RM)
                  </th>
                  <th className='px-6 py-3 text-right texts-table-header text-text-primary'>
                    Employee (RM)
                  </th>
                  <th className='px-6 py-3 text-right texts-table-header text-text-primary'>
                    Total (RM)
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y divide-border-default'>
                <tr>
                  <td className='px-6 py-4 texts-table-cell-primary text-text-primary'>
                    EPF
                  </td>
                  <td className='px-6 py-4 texts-table-cell-data text-text-primary text-right'>
                    {calculations.epf.employer.toFixed(2)}
                  </td>
                  <td className='px-6 py-4 texts-table-cell-data text-text-primary text-right'>
                    {calculations.epf.employee.toFixed(2)}
                  </td>
                  <td className='px-6 py-4 texts-table-cell-data text-text-primary text-right font-medium'>
                    {(
                      calculations.epf.employer + calculations.epf.employee
                    ).toFixed(2)}
                  </td>
                </tr>

                <tr>
                  <td className='px-6 py-4 texts-table-cell-primary text-text-primary'>
                    SOCSO{' '}
                    {age === '60-above' && (
                      <span className='texts-caption-small text-text-secondary'>
                        (Injury only)
                      </span>
                    )}
                  </td>
                  <td className='px-6 py-4 texts-table-cell-data text-text-primary text-right'>
                    {calculations.socso.employer.toFixed(2)}
                  </td>
                  <td className='px-6 py-4 texts-table-cell-data text-text-primary text-right'>
                    {calculations.socso.employee.toFixed(2)}
                  </td>
                  <td className='px-6 py-4 texts-table-cell-data text-text-primary text-right font-medium'>
                    {(
                      calculations.socso.employer + calculations.socso.employee
                    ).toFixed(2)}
                  </td>
                </tr>

                <tr>
                  <td className='px-6 py-4 texts-table-cell-primary text-text-primary'>
                    EIS{' '}
                    {age === '60-above' && (
                      <span className='texts-caption-small text-text-secondary'>
                        (N/A)
                      </span>
                    )}
                  </td>
                  <td className='px-6 py-4 texts-table-cell-data text-text-primary text-right'>
                    {calculations.eis.employer.toFixed(2)}
                  </td>
                  <td className='px-6 py-4 texts-table-cell-data text-text-primary text-right'>
                    {calculations.eis.employee.toFixed(2)}
                  </td>
                  <td className='px-6 py-4 texts-table-cell-data text-text-primary text-right font-medium'>
                    {(
                      calculations.eis.employer + calculations.eis.employee
                    ).toFixed(2)}
                  </td>
                </tr>

                <tr>
                  <td className='px-6 py-4 texts-table-cell-primary text-text-primary'>
                    PCB (Est. Tax)
                  </td>
                  <td className='px-6 py-4 texts-table-cell-data text-text-secondary text-right'>
                    -
                  </td>
                  <td className='px-6 py-4 texts-table-cell-data text-text-primary text-right'>
                    {calculations.pcb.toFixed(2)}
                  </td>
                  <td className='px-6 py-4 texts-table-cell-data text-text-primary text-right font-medium'>
                    {calculations.pcb.toFixed(2)}
                  </td>
                </tr>

                <tr className='bg-background-secondary'>
                  <td className='px-6 py-4 texts-table-cell-primary text-text-primary font-semibold'>
                    Total
                  </td>
                  <td className='px-6 py-4 texts-table-cell-data text-text-primary text-right font-semibold'>
                    {calculations.totalEmployerContributions.toFixed(2)}
                  </td>
                  <td className='px-6 py-4 texts-table-cell-data text-text-primary text-right font-semibold'>
                    {calculations.totalEmployeeDeductions.toFixed(2)}
                  </td>
                  <td className='px-6 py-4 texts-table-cell-data text-text-primary text-right font-semibold'>
                    {(
                      calculations.totalEmployerContributions +
                      calculations.totalEmployeeDeductions
                    ).toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Net Salary */}
          <div className='p-6 bg-background-secondary border-t border-border-default'>
            <div className='grid grid-cols-3 gap-6'>
              <div>
                <p className='texts-label-small text-text-secondary mb-1'>
                  Gross Salary
                </p>
                <p className='texts-heading-h3 text-text-primary'>
                  RM {calculations.grossSalary.toFixed(2)}
                </p>
              </div>
              <div>
                <p className='texts-label-small text-text-secondary mb-1'>
                  Total Deductions
                </p>
                <p className='texts-heading-h3 text-error-main'>
                  - RM {calculations.totalEmployeeDeductions.toFixed(2)}
                </p>
              </div>
              <div>
                <p className='texts-label-small text-text-secondary mb-1'>
                  Net Salary (Take Home)
                </p>
                <p className='texts-heading-h3 text-success-main'>
                  RM {calculations.netSalary.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <div className='px-6 py-4 bg-warning-light border-t border-border-default'>
            <p className='texts-caption-large text-text-secondary flex items-center gap-2'>
              <Info className='w-4 h-4 text-warning-main flex-shrink-0' />
              <strong>Disclaimer:</strong> Tax calculations are estimates based
              on standard reliefs. Actual PCB may vary based on additional
              reliefs, bonuses, and other factors. For accurate calculations,
              use LHDN's official PCB calculator or consult a tax professional.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default MalaysianSalaryCalculator
