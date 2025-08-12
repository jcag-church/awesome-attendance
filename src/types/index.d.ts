interface Family  { 
  id: string; 
  name: string 
}
interface Member { 
  id: string; 
  firstName: string; 
  lastName: string; 
  familyId?: string | null 
}
