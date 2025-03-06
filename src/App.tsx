import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { InputSelect } from "./components/InputSelect";
import { Instructions } from "./components/Instructions";
import { Transactions } from "./components/Transactions";
import { useEmployees } from "./hooks/useEmployees";
import { usePaginatedTransactions } from "./hooks/usePaginatedTransactions";
import { useTransactionsByEmployee } from "./hooks/useTransactionsByEmployee";
import { EMPTY_EMPLOYEE } from "./utils/constants";
import { Employee } from "./utils/types";
/* Imports transaction type for use in state variable. */
import { Transaction } from "./utils/types";

export function App() {
  const { data: employees, ...employeeUtils } = useEmployees();
  const { data: paginatedTransactions, ...paginatedTransactionsUtils } =
    usePaginatedTransactions();
  const { data: transactionsByEmployee, ...transactionsByEmployeeUtils } =
    useTransactionsByEmployee();

  /* Commented out instances of isLoading, as it is no lomger needed for the employee dropdown. Not deleted, as I'm unsure if it will need to be re-added for any reason. */
  // const [isLoading, setIsLoading] = useState(false);

  /* Adding in a state varaiables for updating transaction list in useMemo. */
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);

  /* Creating a useEffect to run setAllTransactions whenever paginated transactions are fetched. */
  useEffect(() => {
    if (paginatedTransactions?.data) {
      setAllTransactions((prev) => [...prev, ...paginatedTransactions.data]);
    }
  }, [paginatedTransactions?.data]);

  /* Finally, updated useMemo to look at the state variable instead of directly looking at paginated data. */
  const transactions = useMemo(() => {
    if (transactionsByEmployee) {
      return transactionsByEmployee;
    } else {
      return allTransactions.length > 0 ? allTransactions : null;
    }
  }, [transactionsByEmployee, allTransactions]);

  const loadAllTransactions = useCallback(async () => {
    // setIsLoading(true);
    transactionsByEmployeeUtils.invalidateData();

    await employeeUtils.fetchAll();
    await paginatedTransactionsUtils.fetchAll();

    // setIsLoading(false);
  }, [employeeUtils, paginatedTransactionsUtils, transactionsByEmployeeUtils]);

  const loadTransactionsByEmployee = useCallback(
    async (employeeId: string) => {
      paginatedTransactionsUtils.invalidateData();
      await transactionsByEmployeeUtils.fetchById(employeeId);
    },
    [paginatedTransactionsUtils, transactionsByEmployeeUtils]
  );

  useEffect(() => {
    if (employees === null && !employeeUtils.loading) {
      loadAllTransactions();
    }
  }, [employeeUtils.loading, employees, loadAllTransactions]);

  return (
    <Fragment>
      <main className="MainContainer">
        <Instructions />

        <hr className="RampBreak--l" />

        <InputSelect<Employee>
          // isLoading={isLoading}
          defaultValue={EMPTY_EMPLOYEE}
          items={employees === null ? [] : [EMPTY_EMPLOYEE, ...employees]}
          label="Filter by employee"
          loadingLabel="Loading employees"
          parseItem={(item) => ({
            value: item.id,
            label: `${item.firstName} ${item.lastName}`,
          })}
          /* Updated following function to handle case where EMPTY_EMPLOYEE is the value instead of null, which is the case when "All Employees" is selected after a particular employee is selected. */
          onChange={async (newValue) => {
            if (newValue === null || newValue === EMPTY_EMPLOYEE) {
              /* When changing back to all employees from a specific one, reloads all transactions fresh. */
              setAllTransactions([]);
              await loadAllTransactions();
            } else {
              await loadTransactionsByEmployee(newValue.id);
            }
          }}
        />

        <div className="RampBreak--l" />

        <div className="RampGrid">
          <Transactions transactions={transactions} />

          {/* Added more conditions, so View More doesn't show if we're in Employee view OR there are no more pagination pages left. */}
          {transactions !== null &&
            paginatedTransactions?.nextPage !== null &&
            !transactionsByEmployee && (
              <button
                className="RampButton"
                disabled={paginatedTransactionsUtils.loading}
                onClick={async () => {
                  await loadAllTransactions();
                }}
              >
                View More
              </button>
            )}
        </div>
      </main>
    </Fragment>
  );
}
