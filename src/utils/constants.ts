import { Employee } from "./types";

/* Updated id to something less ambiguous, to prevent possible type errors when selecting "All Employees" in dropdown. */
export const EMPTY_EMPLOYEE: Employee = {
  id: "all",
  firstName: "All",
  lastName: "Employees",
};
