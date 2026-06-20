import { useState, useMemo } from 'react'
import { Country, State, type ICountry, type IState } from 'country-state-city'
import { Plus } from 'lucide-react'

interface CountryStateSelectProps {
  onAdd: (label: string) => void
}

/**
 * Country -> State cascading picker, backed by the full ISO country/state
 * dataset (country-state-city) — every country in the world, and every
 * state/province Indian Standards body data has for it. Selecting a
 * country alone lets you add just the country; picking a state adds
 * "State, Country".
 */
export default function CountryStateSelect({ onAdd }: CountryStateSelectProps) {
  const countries = useMemo<ICountry[]>(
    () => Country.getAllCountries().sort((a, b) => a.name.localeCompare(b.name)),
    []
  )
  const [countryCode, setCountryCode] = useState('')
  const [stateCode, setStateCode] = useState('')

  const states = useMemo<IState[]>(
    () => (countryCode ? State.getStatesOfCountry(countryCode) : []),
    [countryCode]
  )

  const selectedCountry = countries.find(c => c.isoCode === countryCode)
  const selectedState = states.find(s => s.isoCode === stateCode)

  const handleCountryChange = (code: string) => {
    setCountryCode(code)
    setStateCode('')
  }

  const handleAdd = () => {
    if (!selectedCountry) return
    const label = selectedState ? `${selectedState.name}, ${selectedCountry.name}` : selectedCountry.name
    onAdd(label)
    setStateCode('')
  }

  const selectStyle = {
    flex: 1, padding: '0.65rem 0.9rem', border: '1.5px solid var(--border)', borderRadius: 12,
    fontSize: '0.85rem', fontFamily: 'DM Sans,sans-serif', color: 'var(--earth)', outline: 'none',
    background: 'white', cursor: 'pointer',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
      <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
        <select value={countryCode} onChange={e => handleCountryChange(e.target.value)} style={selectStyle}>
          <option value="">Select a country…</option>
          {countries.map(c => <option key={c.isoCode} value={c.isoCode}>{c.flag} {c.name}</option>)}
        </select>

        {countryCode && (
          states.length > 0 ? (
            <select value={stateCode} onChange={e => setStateCode(e.target.value)} style={selectStyle}>
              <option value="">All / select a state…</option>
              {states.map(s => <option key={s.isoCode} value={s.isoCode}>{s.name}</option>)}
            </select>
          ) : (
            <span style={{ flex: 1, fontSize: '0.78rem', color: 'var(--muted)', display: 'flex', alignItems: 'center' }}>
              No states listed for this country.
            </span>
          )
        )}
      </div>

      {countryCode && (
        <button type="button" onClick={handleAdd}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', alignSelf: 'flex-start', background: 'var(--blush)', color: 'var(--rose)', border: 'none', borderRadius: 10, padding: '0.5rem 1rem', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans,sans-serif' }}>
          <Plus size={14} /> Add {selectedState ? `${selectedState.name}, ${selectedCountry?.name}` : selectedCountry?.name}
        </button>
      )}
    </div>
  )
}
