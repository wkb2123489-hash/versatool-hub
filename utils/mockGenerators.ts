type MockGenLabelKey =
  | 'fieldId'
  | 'fieldUuid'
  | 'fieldName'
  | 'fieldEmail'
  | 'fieldPhone'
  | 'fieldAddress'
  | 'fieldDate'
  | 'fieldCompany';

const FIRST_NAMES = ["John", "Jane", "Alice", "Bob", "Charlie", "Diana", "Edward", "Fiona", "George", "Hannah", "Ivan", "Julia", "Kevin", "Laura", "Michael", "Nancy", "Oscar", "Patricia", "Quinn", "Robert"];
const LAST_NAMES = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin"];
const DOMAINS = ["example.com", "test.org", "demo.io", "web.net", "company.biz"];
const COMPANIES = ["TechCorp", "GlobalFlow", "SkyNet Systems", "NovaSoft", "Quantum Innovations", "EcoLogic", "DataDash", "FutureScale"];
const CITIES = ["New York", "London", "Tokyo", "Berlin", "Paris", "San Francisco", "Sydney", "Toronto"];

export interface MockRecord {
  id?: number;
  uuid?: string;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  company?: string;
  createdAt?: string;
}

export interface FieldDefinition {
  id: string;
  labelKey: MockGenLabelKey;
  default: boolean;
  gen: (index: number) => any;
}

/**
 * Configuration-driven field definitions.
 */
export const FIELD_DEFS: Record<string, FieldDefinition> = {
  id: { 
    id: 'id', 
    labelKey: 'fieldId', 
    default: true,
    gen: (i) => i + 1 
  },
  uuid: { 
    id: 'uuid', 
    labelKey: 'fieldUuid', 
    default: false,
    gen: () => crypto.randomUUID() 
  },
  name: { 
    id: 'name', 
    labelKey: 'fieldName', 
    default: true,
    gen: () => `${FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)]} ${LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)]}` 
  },
  email: { 
    id: 'email', 
    labelKey: 'fieldEmail', 
    default: true,
    gen: () => {
      const f = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)].toLowerCase();
      const l = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)].toLowerCase();
      return `${f}.${l}@${DOMAINS[Math.floor(Math.random() * DOMAINS.length)]}`;
    }
  },
  phone: { 
    id: 'phone', 
    labelKey: 'fieldPhone', 
    default: false,
    gen: () => `+1 (${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}` 
  },
  address: { 
    id: 'address', 
    labelKey: 'fieldAddress', 
    default: false,
    gen: () => `${Math.floor(Math.random() * 9999) + 1} Main St, ${CITIES[Math.floor(Math.random() * CITIES.length)]}` 
  },
  company: { 
    id: 'company', 
    labelKey: 'fieldCompany', 
    default: false,
    gen: () => COMPANIES[Math.floor(Math.random() * COMPANIES.length)] 
  },
  date: { 
    id: 'date', 
    labelKey: 'fieldDate', 
    default: true,
    gen: () => {
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 365));
      return date.toISOString();
    }
  }
};

export type FieldKey = keyof typeof FIELD_DEFS;

/**
 * Static single-source of truth for default field configurations.
 */
export const DEFAULT_FIELDS: Record<FieldKey, boolean> = Object.fromEntries(
  Object.entries(FIELD_DEFS).map(([k, v]) => [k, v.default])
) as Record<FieldKey, boolean>;

/**
 * Core generation logic
 */
export function generateMockData(count: number, activeFields: Record<FieldKey, boolean>): MockRecord[] {
  const data: MockRecord[] = [];
  const fieldKeys = Object.keys(FIELD_DEFS) as FieldKey[];
  
  for (let i = 0; i < count; i++) {
    const record: MockRecord = {};
    
    fieldKeys.forEach((key) => {
      if (activeFields[key]) {
        const val = FIELD_DEFS[key].gen(i);
        if (key === 'date') {
          record.createdAt = val;
        } else {
          (record as any)[key] = val;
        }
      }
    });
    
    data.push(record);
  }
  
  return data;
}
