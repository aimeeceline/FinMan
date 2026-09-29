import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { Transaction } from '../../types';
import { statisticsService, type StatisticsOverview, type CategoryBreakdownItem } from '../../services/statisticsService';
import { transactionService } from '../../services/transactionService';

interface StatisticsPageProps {
  transactions?: Transaction[];
}

export const StatisticsPage: React.FC<StatisticsPageProps> = ({ transactions = [] }) => {
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  // Backend overview data (if available)
  const [serverOverview, setServerOverview] = useState<StatisticsOverview | null>(null);

  const currentDate = new Date();
  const currentMonthStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

  // Interactive Spending Calendar State
  const [calMonth, setCalMonth] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [selectedDay, setSelectedDay] = useState<number>(() => {
    return new Date().getDate();
  });
  const [calMonthTransactions, setCalMonthTransactions] = useState<Transaction[]>([]);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState<number>(() => {
    const d = new Date();
    return d.getFullYear();
  });
  const pickerRef = useRef<HTMLDivElement>(null);

  // Cashflow Trend Mode: 'WEEK' | 'MONTH' | 'YEAR' (all synchronized with calendar date & month)
  const [trendViewMode, setTrendViewMode] = useState<'WEEK' | 'MONTH' | 'YEAR'>('WEEK');
  const [yearTransactions, setYearTransactions] = useState<Transaction[]>([]);

  // Fetch full year transactions for YEAR view mode
  useEffect(() => {
    let isMounted = true;
    const year = calMonth.split('-')[0];
    transactionService.getTransactions({
      startDate: `${year}-01-01`,
      endDate: `${year}-12-31`,
      size: 500,
    })
      .then((txs) => {
        if (isMounted) setYearTransactions(txs || []);
      })
      .catch((err) => {
        console.warn('Could not load full year transactions:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [calMonth]);

  // Category Breakdown State: Type & Active Hover (Month is synced directly with calMonth from Interactive Calendar)
  const [breakdownType, setBreakdownType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
  const [breakdownData, setBreakdownData] = useState<CategoryBreakdownItem[]>([]);
  const [hoveredCategoryName, setHoveredCategoryName] = useState<string | null>(null);

  // Fetch breakdown data when calMonth or breakdownType changes
  useEffect(() => {
    let isMounted = true;
    statisticsService.getCategories({ month: calMonth, type: breakdownType })
      .then((items) => {
        if (isMounted) setBreakdownData(items || []);
      })
      .catch((err) => {
        console.warn('Could not load category breakdown from API:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [calMonth, breakdownType]);

  // Close month picker popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setIsMonthPickerOpen(false);
      }
    };
    if (isMonthPickerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMonthPickerOpen]);

  // Sync pickerYear when calMonth changes
  useEffect(() => {
    const [y] = calMonth.split('-').map(Number);
    if (y) setPickerYear(y);
  }, [calMonth]);

  // Load transactions for the calendar month
  useEffect(() => {
    let isMounted = true;
    transactionService.getTransactions({ month: calMonth })
      .then((txs) => {
        if (isMounted) setCalMonthTransactions(txs);
      })
      .catch((err) => {
        console.warn('Could not load calendar month transactions:', err);
        if (isMounted) {
          setCalMonthTransactions(transactions.filter((t) => t.date?.startsWith(calMonth)));
        }
      });
    return () => {
      isMounted = false;
    };
  }, [calMonth, transactions]);

  // Derived calendar parameters
  const [calendarYear, calendarMonth] = useMemo(() => {
    const parts = calMonth.split('-').map(Number);
    return [parts[0] || 2026, parts[1] || 9];
  }, [calMonth]);

  const daysInMonth = useMemo(() => {
    return new Date(calendarYear, calendarMonth, 0).getDate();
  }, [calendarYear, calendarMonth]);

  // Weekday offset for the 1st of month (0 = Mon, 6 = Sun)
  const startDayOfWeek = useMemo(() => {
    const day = new Date(calendarYear, calendarMonth - 1, 1).getDay(); // 0 is Sun, 1 is Mon...
    return (day + 6) % 7;
  }, [calendarYear, calendarMonth]);

  // Reset selectedDay if it exceeds days in month
  useEffect(() => {
    if (selectedDay > daysInMonth) {
      setSelectedDay(daysInMonth);
    }
  }, [daysInMonth, selectedDay]);

  // Merge transactions from props, calMonthTransactions, and yearTransactions
  const allTransactions = useMemo(() => {
    const map = new Map<number, Transaction>();
    transactions.forEach((t) => {
      if (t.id != null) map.set(t.id, t);
    });
    calMonthTransactions.forEach((t) => {
      if (t.id != null) map.set(t.id, t);
    });
    yearTransactions.forEach((t) => {
      if (t.id != null) map.set(t.id, t);
    });
    return Array.from(map.values());
  }, [transactions, calMonthTransactions, yearTransactions]);

  // Daily aggregate map for Calendar heatmap
  const dailyCashflows = useMemo(() => {
    const map = new Map<number, { income: number; expense: number; list: Transaction[] }>();
    calMonthTransactions.forEach((txn) => {
      if (!txn.date) return;
      const day = parseInt(txn.date.split('-')[2], 10);
      if (!map.has(day)) {
        map.set(day, { income: 0, expense: 0, list: [] });
      }
      const item = map.get(day)!;
      if (txn.type === 'INCOME') {
        item.income += txn.amount;
      } else if (txn.type === 'EXPENSE') {
        item.expense += txn.amount;
      }
      item.list.push(txn);
    });
    return map;
  }, [calMonthTransactions]);

  // Selected Day Transactions for popup drilldown
  const selectedDayTransactions = useMemo(() => {
    return dailyCashflows.get(selectedDay)?.list || [];
  }, [dailyCashflows, selectedDay]);

  const selectedDayFlow = useMemo(() => {
    return dailyCashflows.get(selectedDay) || { income: 0, expense: 0, list: [] };
  }, [dailyCashflows, selectedDay]);

  const handlePrevCalMonth = () => {
    const [y, m] = calMonth.split('-').map(Number);
    const prev = new Date(y, m - 2, 1);
    setCalMonth(`${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`);
  };

  const handleNextCalMonth = () => {
    const [y, m] = calMonth.split('-').map(Number);
    const next = new Date(y, m, 1);
    setCalMonth(`${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`);
  };

  const formatCalMonthLabel = (m: string) => {
    const [y, mon] = m.split('-');
    return `Th ${parseInt(mon, 10)}/${y}`;
  };

  const handleChartPointClick = (d: { dateStr: string; label: string }) => {
    if (trendViewMode === 'YEAR') {
      const [y, m] = d.dateStr.split('-').map(Number);
      const newMonthStr = `${y}-${String(m).padStart(2, '0')}`;
      if (newMonthStr !== calMonth) {
        setCalMonth(newMonthStr);
      }
      setSelectedDay(1);
    } else {
      const [y, m, dayNum] = d.dateStr.split('-').map(Number);
      const newMonthStr = `${y}-${String(m).padStart(2, '0')}`;
      if (newMonthStr !== calMonth) {
        setCalMonth(newMonthStr);
      }
      setSelectedDay(dayNum);
    }
  };

  // Fetch backend statistics overview
  const fetchStatistics = useCallback(async () => {
    try {
      const data = await statisticsService.getOverview({ month: currentMonthStr });
      if (data) {
        setServerOverview(data);
      }
    } catch (err) {
      console.warn('Could not load statistics from backend API, falling back to local props calculation:', err);
    }
  }, [currentMonthStr]);

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  // Filter local transactions according to current month
  const filteredTransactions = useMemo(() => {
    if (!transactions || transactions.length === 0) return [];
    return transactions.filter((t) => {
      if (!t.date) return true;
      return t.date.startsWith(currentMonthStr);
    });
  }, [transactions, currentMonthStr]);

  // Computations
  const totalIncome = serverOverview?.totalIncome ?? filteredTransactions
    .filter((t) => t.type === 'INCOME')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = serverOverview?.totalExpense ?? filteredTransactions
    .filter((t) => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + t.amount, 0);

  const surplus = serverOverview?.netCashFlow ?? (totalIncome - totalExpense);
  const savingsRate = serverOverview?.savingsRate ?? (totalIncome > 0 ? Math.round((surplus / totalIncome) * 100) : 0);
  const expenseRate = serverOverview?.expenseRate ?? (totalIncome > 0 ? Math.round((totalExpense / totalIncome) * 1000) / 10 : 0);

  // Effective transactions for breakdown card (synced with calMonth)
  const effectiveBreakdownTransactions = useMemo(() => {
    const list = [...calMonthTransactions];
    allTransactions.forEach((t) => {
      if (t.date?.startsWith(calMonth) && !list.some((item) => item.id === t.id)) {
        list.push(t);
      }
    });
    return list.filter((t) => t.type === breakdownType);
  }, [calMonthTransactions, allTransactions, calMonth, breakdownType]);

  const totalBreakdownAmount = useMemo(() => {
    if (breakdownData.length > 0) {
      return breakdownData.reduce((sum, item) => sum + item.totalAmount, 0);
    }
    return effectiveBreakdownTransactions.reduce((sum, t) => sum + t.amount, 0);
  }, [breakdownData, effectiveBreakdownTransactions]);

  const categoryBreakdownList = useMemo(() => {
    const colors = breakdownType === 'EXPENSE'
      ? ['#dc2626', '#f59e0b', '#006c4a', '#004ed0', '#8b5cf6', '#ec4899', '#14b8a6', '#64748b']
      : ['#006c4a', '#10b981', '#004ed0', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6'];

    if (breakdownData.length > 0) {
      return breakdownData.map((c, idx) => ({
        id: c.categoryId,
        name: c.categoryName,
        icon: c.categoryIcon || (breakdownType === 'EXPENSE' ? 'shopping_bag' : 'payments'),
        amount: c.totalAmount,
        percent: c.percentage,
        color: colors[idx % colors.length],
      }));
    }

    const map = new Map<string, { amount: number; icon: string; color: string }>();
    effectiveBreakdownTransactions.forEach((t) => {
      const name = t.category?.name || 'Khác';
      const prev = map.get(name) || {
        amount: 0,
        icon: t.category?.icon || (breakdownType === 'EXPENSE' ? 'shopping_bag' : 'payments'),
        color: t.category?.color || '#dc2626',
      };
      map.set(name, {
        ...prev,
        amount: prev.amount + t.amount,
      });
    });

    return Array.from(map.entries())
      .map(([name, val], idx) => ({
        id: idx,
        name,
        icon: val.icon,
        amount: val.amount,
        percent: totalBreakdownAmount > 0 ? Math.round((val.amount / totalBreakdownAmount) * 1000) / 10 : 0,
        color: val.color || colors[idx % colors.length],
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [breakdownData, effectiveBreakdownTransactions, totalBreakdownAmount, breakdownType]);

  // Top Expenses calculation
  const topExpensesList = useMemo(() => {
    if (serverOverview?.topExpenses && serverOverview.topExpenses.length > 0) {
      return serverOverview.topExpenses.map((t) => ({
        id: t.id,
        note: t.note || 'Chi tiêu không ghi chú',
        amount: t.amount,
        date: t.transactionDate,
        categoryName: t.categoryName || 'Chi tiêu',
        categoryIcon: t.categoryIcon || 'shopping_bag',
        accountName: t.accountName || 'Ví chính',
        percent: totalExpense > 0 ? Math.round((t.amount / totalExpense) * 1000) / 10 : 0,
      }));
    }

    return filteredTransactions
      .filter((t) => t.type === 'EXPENSE')
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
      .map((t) => ({
        id: t.id,
        note: t.note || `${t.category?.name || 'Chi tiêu'}`,
        amount: t.amount,
        date: t.date,
        categoryName: t.category?.name || 'Chi tiêu',
        categoryIcon: t.category?.icon || 'shopping_bag',
        accountName: t.account?.name || 'Ví tiền mặt',
        percent: totalExpense > 0 ? Math.round((t.amount / totalExpense) * 1000) / 10 : 0,
      }));
  }, [serverOverview, filteredTransactions, totalExpense]);

  // Format local date as YYYY-MM-DD
  const formatLocalDate = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Selected date string YYYY-MM-DD from calendar
  const selectedDateStr = useMemo(() => {
    return `${calMonth}-${String(selectedDay).padStart(2, '0')}`;
  }, [calMonth, selectedDay]);

  // Cashflow trend calculation for SVG chart: TUẦN / THÁNG / NĂM (đồng bộ với thời điểm trên lịch)
  const trendPoints = useMemo(() => {
    const [calYear, calMonthNum] = calMonth.split('-').map(Number);
    const todayStr = formatLocalDate(new Date());

    if (trendViewMode === 'WEEK') {
      const dayLabels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
      const result: {
        label: string;
        dateStr: string;
        displayDate: string;
        isToday: boolean;
        isSelected: boolean;
        expense: number;
        income: number;
      }[] = [];

      const safeDay = Math.min(selectedDay, new Date(calYear, calMonthNum, 0).getDate());
      const targetDate = new Date(calYear, calMonthNum - 1, safeDay);

      // Thứ Hai của tuần chứa ngày đang chọn
      const dayOfWeek = targetDate.getDay();
      const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const monday = new Date(targetDate);
      monday.setDate(targetDate.getDate() + diffToMonday);
      monday.setHours(0, 0, 0, 0);

      for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        const dateStr = formatLocalDate(d);
        const displayDate = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;

        const dayTxs = allTransactions.filter((t) => t.date === dateStr);
        const dayExpense = dayTxs.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
        const dayIncome = dayTxs.filter((t) => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);

        result.push({
          label: dayLabels[i],
          dateStr,
          displayDate,
          isToday: dateStr === todayStr,
          isSelected: dateStr === selectedDateStr,
          expense: dayExpense,
          income: dayIncome,
        });
      }
      return result;
    }

    if (trendViewMode === 'MONTH') {
      const daysCount = new Date(calYear, calMonthNum, 0).getDate();
      const result: {
        label: string;
        dateStr: string;
        displayDate: string;
        isToday: boolean;
        isSelected: boolean;
        expense: number;
        income: number;
      }[] = [];

      for (let day = 1; day <= daysCount; day++) {
        const dateStr = `${calYear}-${String(calMonthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const displayDate = `${String(day).padStart(2, '0')}/${String(calMonthNum).padStart(2, '0')}`;

        const dayTxs = allTransactions.filter((t) => t.date === dateStr);
        const dayExpense = dayTxs.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
        const dayIncome = dayTxs.filter((t) => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);

        result.push({
          label: String(day),
          dateStr,
          displayDate,
          isToday: dateStr === todayStr,
          isSelected: day === selectedDay,
          expense: dayExpense,
          income: dayIncome,
        });
      }
      return result;
    }

    // trendViewMode === 'YEAR'
    const result: {
      label: string;
      dateStr: string;
      displayDate: string;
      isToday: boolean;
      isSelected: boolean;
      expense: number;
      income: number;
    }[] = [];

    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth() + 1;

    for (let m = 1; m <= 12; m++) {
      const monthPrefix = `${calYear}-${String(m).padStart(2, '0')}`;
      const monthTxs = allTransactions.filter((t) => t.date?.startsWith(monthPrefix));
      const mExpense = monthTxs.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
      const mIncome = monthTxs.filter((t) => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);

      result.push({
        label: `Th ${m}`,
        dateStr: monthPrefix,
        displayDate: `Tháng ${m}/${calYear}`,
        isToday: calYear === curYear && m === curMonth,
        isSelected: m === calMonthNum,
        expense: mExpense,
        income: mIncome,
      });
    }
    return result;
  }, [trendViewMode, calMonth, selectedDay, selectedDateStr, allTransactions]);

  const trendTitle = useMemo(() => {
    if (trendViewMode === 'WEEK') {
      return `Xu hướng dòng tiền tuần ${trendPoints[0]?.displayDate} – ${trendPoints[6]?.displayDate}`;
    }
    if (trendViewMode === 'MONTH') {
      const [y, m] = calMonth.split('-');
      return `Xu hướng dòng tiền Tháng ${parseInt(m, 10)}/${y}`;
    }
    const [y] = calMonth.split('-');
    return `Xu hướng dòng tiền Năm ${y}`;
  }, [trendViewMode, trendPoints, calMonth]);

  const trendSubtitle = useMemo(() => {
    const [y, m] = calMonth.split('-');
    if (trendViewMode === 'WEEK') {
      return `Biến động thu chi tuần chứa ngày ${String(selectedDay).padStart(2, '0')}/${m}`;
    }
    if (trendViewMode === 'MONTH') {
      return `Biến động thu chi ${trendPoints.length} ngày trong tháng (ngày chọn: ${String(selectedDay).padStart(2, '0')}/${m})`;
    }
    return `Biến động thu chi 12 tháng năm ${y} (tháng đang chọn: Th ${parseInt(m, 10)})`;
  }, [trendViewMode, trendPoints, calMonth, selectedDay]);

  const maxDailyValue = Math.max(
    ...trendPoints.map((d) => Math.max(d.expense, d.income)),
    100000
  );
  const ceilingValue = maxDailyValue * 1.25;
  const baselineY = 175;

  const totalPeriodExpense = trendPoints.reduce((s, d) => s + d.expense, 0);
  const totalPeriodIncome = trendPoints.reduce((s, d) => s + d.income, 0);
  const netPeriodCashflow = totalPeriodIncome - totalPeriodExpense;
  const avgExpense = Math.round(totalPeriodExpense / (trendPoints.length || 1));
  const avgIncome = Math.round(totalPeriodIncome / (trendPoints.length || 1));

  const peakExpenseIndex = trendPoints.reduce(
    (maxIdx, curr, idx, arr) => (curr.expense > arr[maxIdx].expense ? idx : maxIdx),
    0
  );
  const peakExpense = trendPoints[peakExpenseIndex]?.expense || 0;

  const peakIncomeIndex = trendPoints.reduce(
    (maxIdx, curr, idx, arr) => (curr.income > arr[maxIdx].income ? idx : maxIdx),
    0
  );
  const peakIncome = trendPoints[peakIncomeIndex]?.income || 0;

  // Chart SVG Coordinates computation
  const svgWidth = 680;
  const marginX = trendViewMode === 'MONTH' ? 24 : 50;
  const availableWidth = svgWidth - marginX * 2;
  const stepX = availableWidth / Math.max(1, trendPoints.length - 1);

  const expensePoints = useMemo(() => {
    return trendPoints.map((d, i) => {
      const x = Math.round(marginX + i * stepX);
      const normalizedY = d.expense / (ceilingValue || 1);
      const y = Math.round(baselineY - normalizedY * 135);
      return { x, y, value: d.expense, ...d };
    });
  }, [trendPoints, ceilingValue, stepX, baselineY, marginX]);

  const incomePoints = useMemo(() => {
    return trendPoints.map((d, i) => {
      const x = Math.round(marginX + i * stepX);
      const normalizedY = d.income / (ceilingValue || 1);
      const y = Math.round(baselineY - normalizedY * 135);
      return { x, y, value: d.income, ...d };
    });
  }, [trendPoints, ceilingValue, stepX, baselineY, marginX]);

  // Generate smooth SVG bezier path
  const generateBezier = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return '';
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;

    let path = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const curr = pts[i];
      const next = pts[i + 1];
      const cx1 = curr.x + (next.x - curr.x) / 2;
      const cy1 = curr.y;
      const cx2 = curr.x + (next.x - curr.x) / 2;
      const cy2 = next.y;
      path += ` C ${cx1} ${cy1}, ${cx2} ${cy2}, ${next.x} ${next.y}`;
    }
    return path;
  };

  const expenseCurvePath = useMemo(() => generateBezier(expensePoints), [expensePoints]);
  const incomeCurvePath = useMemo(() => generateBezier(incomePoints), [incomePoints]);

  const expenseAreaPath = useMemo(() => {
    if (expensePoints.length === 0) return '';
    const last = expensePoints[expensePoints.length - 1];
    const first = expensePoints[0];
    return `${expenseCurvePath} L ${last.x} ${baselineY} L ${first.x} ${baselineY} Z`;
  }, [expenseCurvePath, expensePoints, baselineY]);

  const incomeAreaPath = useMemo(() => {
    if (incomePoints.length === 0) return '';
    const last = incomePoints[incomePoints.length - 1];
    const first = incomePoints[0];
    return `${incomeCurvePath} L ${last.x} ${baselineY} L ${first.x} ${baselineY} Z`;
  }, [incomeCurvePath, incomePoints, baselineY]);

  // Donut chart SVG calculations (Supports any number of categories dynamically)
  // Pure vector SVG arc path generator (starts at 12 o'clock, moving clockwise)
  const getDonutArcPath = (cx: number, cy: number, r: number, startRatio: number, endRatio: number, hasGap: boolean) => {
    const diffRatio = endRatio - startRatio;
    if (diffRatio >= 0.999) {
      return `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r} Z`;
    }
    const totalAngle = 2 * Math.PI;
    const rawStart = startRatio * totalAngle;
    const rawEnd = endRatio * totalAngle;
    const gap = hasGap ? Math.min(0.04, (rawEnd - rawStart) * 0.25) : 0;
    const startAngle = rawStart + gap / 2;
    const endAngle = rawEnd - gap / 2;

    const x1 = cx + r * Math.sin(startAngle);
    const y1 = cy - r * Math.cos(startAngle);
    const x2 = cx + r * Math.sin(endAngle);
    const y2 = cy - r * Math.cos(endAngle);
    const largeArcFlag = endAngle - startAngle > Math.PI ? 1 : 0;

    return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${largeArcFlag} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
  };

  const topBreakdownCategory = categoryBreakdownList[0];

  const donutSegments = useMemo(() => {
    if (!totalBreakdownAmount || categoryBreakdownList.length === 0) return [];
    let accumulatedRatio = 0;
    const hasGap = categoryBreakdownList.length > 1;

    return categoryBreakdownList.map((cat) => {
      const ratio = cat.amount / totalBreakdownAmount;
      const startRatio = accumulatedRatio;
      const endRatio = accumulatedRatio + ratio;
      accumulatedRatio = endRatio;

      const pathData = getDonutArcPath(80, 80, 64, startRatio, endRatio, hasGap);

      return {
        ...cat,
        ratio,
        pathData,
      };
    });
  }, [categoryBreakdownList, totalBreakdownAmount]);

  const activeCategory = useMemo(() => {
    if (hoveredCategoryName) {
      return categoryBreakdownList.find((c) => c.name === hoveredCategoryName) || topBreakdownCategory;
    }
    return topBreakdownCategory;
  }, [hoveredCategoryName, categoryBreakdownList, topBreakdownCategory]);

  const sortedDonutSegments = useMemo(() => {
    if (!hoveredCategoryName) return donutSegments;
    return [...donutSegments].sort((a, b) => {
      if (a.name === hoveredCategoryName) return 1;
      if (b.name === hoveredCategoryName) return -1;
      return 0;
    });
  }, [donutSegments, hoveredCategoryName]);


  return (
    <div className="w-full max-w-[1600px] mx-auto px-gutter-desktop py-space-lg select-none">
      {/* 1. Financial Health Banner (AI Intelligence Banner) */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-secondary-fixed/40 via-surface-container-low to-surface-container-lowest p-space-lg shadow-sm mb-space-xl border border-secondary/20">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-space-lg">
          <div className="flex items-start gap-space-md">
            <div className="w-12 h-12 rounded-2xl bg-secondary text-on-secondary flex items-center justify-center shadow-sm shrink-0">
              <span className="material-symbols-outlined text-[28px]">verified_user</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-space-xs mb-space-2xs">
                <span className="font-headline-sm text-headline-sm text-on-surface font-extrabold">
                  {surplus >= 0 ? 'Tình trạng tài chính: Rất khả quan' : 'Tình trạng tài chính: Cần kiểm soát chi tiêu'}
                </span>
                <span
                  className={`px-space-xs py-0.5 rounded-full font-label-sm text-label-sm font-bold ${
                    surplus >= 0
                      ? 'bg-secondary text-on-secondary'
                      : 'bg-primary-container text-on-primary-container'
                  }`}
                >
                  {savingsRate}% {surplus >= 0 ? 'thặng dư dòng tiền' : 'vượt dòng tiền'}
                </span>
              </div>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
                {totalIncome === 0 && totalExpense === 0
                  ? 'Chưa ghi nhận dữ liệu giao dịch trong chu kỳ này. Hãy ghi chép giao dịch để xem đánh giá thông minh từ FinMan AI.'
                  : surplus >= 0
                  ? `Tuyệt vời! Bạn đang kiểm soát chi tiêu ở mức ${expenseRate}% tổng thu nhập. Dòng tiền dự kiến tăng trưởng ổn định theo mục tiêu tích lũy.`
                  : `Cảnh báo: Chi tiêu đang vượt thu nhập. Bạn đã chi ${expenseRate}% thu nhập trong kỳ này. Khuyến nghị cắt giảm các khoản mua sắm không thiết yếu.`}
              </p>
            </div>
          </div>

          {/* 3 Primary Highlight Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-md shrink-0">
            {/* Dòng tiền thuần */}
            <div className="bg-surface-container-lowest/80 backdrop-blur px-space-md py-space-sm rounded-xl shadow-sm flex flex-col min-w-[170px] border border-outline-variant/20">
              <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center justify-between">
                <span>Dòng tiền thuần</span>
                <span
                  className={`material-symbols-outlined text-[16px] ${
                    surplus >= 0 ? 'text-secondary' : 'text-primary'
                  }`}
                >
                  {surplus >= 0 ? 'north_east' : 'south_east'}
                </span>
              </span>
              <span
                className={`font-currency-display text-currency-display tracking-tight mt-space-2xs ${
                  surplus >= 0 ? 'text-secondary' : 'text-primary'
                }`}
              >
                {surplus >= 0 ? '+' : ''}
                {surplus.toLocaleString('vi-VN')}₫
              </span>
              <span className="font-label-sm text-label-sm text-secondary font-semibold">
                {savingsRate}% thu nhập
              </span>
            </div>

            {/* Tổng thu nhập */}
            <div className="bg-surface-container-lowest/80 backdrop-blur px-space-md py-space-sm rounded-xl shadow-sm flex flex-col min-w-[170px] border border-outline-variant/20">
              <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center justify-between">
                <span>Tổng thu nhập</span>
                <span className="material-symbols-outlined text-[16px] text-tertiary">arrow_downward</span>
              </span>
              <span className="font-currency-display text-currency-display text-on-surface tracking-tight mt-space-2xs">
                {totalIncome.toLocaleString('vi-VN')}₫
              </span>
              <span className="font-label-sm text-label-sm text-tertiary font-medium">
                {filteredTransactions.filter((t) => t.type === 'INCOME').length} khoản thu
              </span>
            </div>

            {/* Tổng chi tiêu */}
            <div className="bg-surface-container-lowest/80 backdrop-blur px-space-md py-space-sm rounded-xl shadow-sm flex flex-col min-w-[170px] border border-outline-variant/20">
              <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center justify-between">
                <span>Tổng chi tiêu</span>
                <span className="material-symbols-outlined text-[16px] text-primary">arrow_upward</span>
              </span>
              <span className="font-currency-display text-currency-display text-primary tracking-tight mt-space-2xs">
                {totalExpense.toLocaleString('vi-VN')}₫
              </span>
              <span className="font-label-sm text-label-sm text-primary font-semibold">
                {expenseRate}% ngân sách
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Desktop 2-Column Analytic Visualization Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
        {/* LEFT COLUMN: Charts & Category Ledger Breakdowns (7 Columns) */}
        <div className="lg:col-span-7 flex flex-col gap-space-lg">
          {/* Cashflow Trend Over Time Card */}
          <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm flex flex-col border border-outline-variant/20">
            <div className="flex flex-col md:flex-row md:items-center justify-between pb-space-md border-b border-outline-variant/20 gap-3">
              {/* Left: Icon, Title, Subtitle */}
              <div className="flex items-center gap-space-xs">
                <div className="w-9 h-9 rounded-xl bg-surface-container-high flex items-center justify-center text-primary shadow-sm shrink-0">
                  <span className="material-symbols-outlined text-[20px]">show_chart</span>
                </div>
                <div>
                  <h2 className="font-title-md text-title-md text-on-surface font-bold">
                    {trendTitle}
                  </h2>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    {trendSubtitle}
                  </p>
                </div>
              </div>

              {/* Right: View Mode Toggle & Legend */}
              <div className="flex flex-wrap items-center gap-3 md:justify-end">
                {/* View Mode Toggle: Tuần / Tháng / Năm */}
                <div className="flex items-center bg-surface-container rounded-xl p-0.5 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setTrendViewMode('WEEK')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      trendViewMode === 'WEEK'
                        ? 'bg-surface-container-lowest text-primary shadow-xs'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    Tuần
                  </button>
                  <button
                    type="button"
                    onClick={() => setTrendViewMode('MONTH')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      trendViewMode === 'MONTH'
                        ? 'bg-surface-container-lowest text-primary shadow-xs'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    Tháng
                  </button>
                  <button
                    type="button"
                    onClick={() => setTrendViewMode('YEAR')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      trendViewMode === 'YEAR'
                        ? 'bg-surface-container-lowest text-primary shadow-xs'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    Năm
                  </button>
                </div>

                {/* Legend & Average */}
                <div className="flex flex-col sm:items-end gap-0.5 border-l border-outline-variant/30 pl-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-secondary">
                      <span className="w-2.5 h-2.5 rounded-full bg-secondary"></span>
                      <span>Thu nhập</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
                      <span className="w-2.5 h-2.5 rounded-full bg-primary"></span>
                      <span>Chi tiêu</span>
                    </div>
                  </div>
                  <span className="font-body-sm text-body-sm text-on-surface-variant text-[11px]">
                    TB: <span className="font-bold text-secondary">+{avgIncome.toLocaleString('vi-VN')}₫</span> / <span className="font-bold text-primary">-{avgExpense.toLocaleString('vi-VN')}₫</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Inline SVG Cashflow Trend Chart with gradient area */}
            <div className="relative w-full pt-space-md pb-space-xs">
              <div className="flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm px-space-xs mb-space-xs">
                <span>Trần: {ceilingValue.toLocaleString('vi-VN')}₫</span>
                <div className="flex items-center gap-3 text-xs font-semibold">
                  {peakIncome > 0 && (
                    <span className="text-secondary flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-secondary"></span>
                      <span>Đỉnh thu: {trendPoints[peakIncomeIndex]?.label} ({peakIncome.toLocaleString('vi-VN')}₫)</span>
                    </span>
                  )}
                  {peakExpense > 0 && (
                    <span className="text-primary flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                      <span>Đỉnh chi: {trendPoints[peakExpenseIndex]?.label} ({peakExpense.toLocaleString('vi-VN')}₫)</span>
                    </span>
                  )}
                </div>
              </div>

              <svg
                className="w-full h-64 overflow-visible"
                fill="none"
                viewBox="0 0 680 236"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  {/* Expense Gradient */}
                  <linearGradient id="expenseAreaGrad" x1="0" x2="0" y1="0" y2="175" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#dc2626" stopOpacity="0.22"></stop>
                    <stop offset="0.8" stopColor="#dc2626" stopOpacity="0.02"></stop>
                    <stop offset="1" stopColor="#dc2626" stopOpacity="0"></stop>
                  </linearGradient>

                  {/* Income Gradient */}
                  <linearGradient id="incomeAreaGrad" x1="0" x2="0" y1="0" y2="175" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#006c4a" stopOpacity="0.18"></stop>
                    <stop offset="0.8" stopColor="#006c4a" stopOpacity="0.02"></stop>
                    <stop offset="1" stopColor="#006c4a" stopOpacity="0"></stop>
                  </linearGradient>
                </defs>

                {/* Horizontal Grid Guide Lines */}
                <line x1="0" y1="35" x2="680" y2="35" stroke="#dae2fd" strokeWidth="1" strokeDasharray="4 4"></line>
                <line x1="0" y1="80" x2="680" y2="80" stroke="#dae2fd" strokeWidth="1" strokeDasharray="4 4"></line>
                <line x1="0" y1="125" x2="680" y2="125" stroke="#dae2fd" strokeWidth="1" strokeDasharray="4 4"></line>
                <line x1="0" y1="175" x2="680" y2="175" stroke="#dae2fd" strokeWidth="1"></line>

                {/* Income Area & Curve */}
                {incomeAreaPath && <path d={incomeAreaPath} fill="url(#incomeAreaGrad)"></path>}
                {incomeCurvePath && (
                  <path
                    d={incomeCurvePath}
                    stroke="#006c4a"
                    strokeWidth="3"
                    strokeLinecap="round"
                  ></path>
                )}

                {/* Expense Area & Curve */}
                {expenseAreaPath && <path d={expenseAreaPath} fill="url(#expenseAreaGrad)"></path>}
                {expenseCurvePath && (
                  <path
                    d={expenseCurvePath}
                    stroke="#dc2626"
                    strokeWidth="3"
                    strokeLinecap="round"
                  ></path>
                )}

                {/* Milestone Key Data Points for Income */}
                {incomePoints.map((pt, i) => {
                  const isHovered = hoveredPoint === i;
                  const shouldShow = trendViewMode !== 'MONTH' || pt.value > 0 || pt.isSelected || isHovered;
                  if (!shouldShow) return null;
                  return (
                    <circle
                      key={`inc-${i}`}
                      cx={pt.x}
                      cy={pt.y}
                      r={isHovered ? 6 : 4}
                      fill="#ffffff"
                      stroke="#006c4a"
                      strokeWidth="2.5"
                      className="cursor-pointer transition-all"
                      onClick={() => handleChartPointClick(trendPoints[i])}
                    />
                  );
                })}

                {/* Milestone Key Data Points for Expense */}
                {expensePoints.map((pt, i) => {
                  const isHovered = hoveredPoint === i;
                  const shouldShow = trendViewMode !== 'MONTH' || pt.value > 0 || pt.isSelected || isHovered;
                  if (!shouldShow) return null;
                  return (
                    <circle
                      key={`exp-${i}`}
                      cx={pt.x}
                      cy={pt.y}
                      r={isHovered ? 6 : 4}
                      fill="#ffffff"
                      stroke="#dc2626"
                      strokeWidth="2.5"
                      className="cursor-pointer transition-all"
                      onClick={() => handleChartPointClick(trendPoints[i])}
                    />
                  );
                })}

                {/* Labels rendered directly inside SVG for 100% mathematical vertical alignment */}
                {trendPoints.map((d, i) => {
                  const pt = expensePoints[i];
                  const isHovered = hoveredPoint === i;
                  const isMonthMode = trendViewMode === 'MONTH';
                  const isMajorDay = i === 0 || i === trendPoints.length - 1 || Number(d.label) % 5 === 0;
                  const shouldShowText = !isMonthMode || d.isSelected || isHovered || isMajorDay;

                  return (
                    <g
                      key={`pt-${i}`}
                      className="cursor-pointer select-none"
                      onMouseEnter={() => setHoveredPoint(i)}
                      onMouseLeave={() => setHoveredPoint(null)}
                      onClick={() => handleChartPointClick(d)}
                    >
                      {/* Active/Hover/Selected highlight pill behind label */}
                      {(isHovered || d.isSelected || d.isToday) && (
                        <rect
                          x={pt.x - (isMonthMode ? 14 : 22)}
                          y={186}
                          width={isMonthMode ? 28 : 44}
                          height={22}
                          rx={6}
                          fill={
                            isHovered
                              ? '#131b2e'
                              : d.isSelected
                              ? '#ffdad6'
                              : d.isToday
                              ? '#eaedff'
                              : 'transparent'
                          }
                          className="transition-colors"
                        />
                      )}

                      {/* Day / Month Label */}
                      {shouldShowText ? (
                        <>
                          <text
                            x={pt.x}
                            y={trendViewMode === 'WEEK' ? 200 : 202}
                            textAnchor="middle"
                            fontFamily="Inter"
                            fontSize={isMonthMode ? '10' : '11'}
                            fontWeight={isHovered || d.isSelected || d.isToday ? '700' : '600'}
                            fill={
                              isHovered
                                ? '#ffffff'
                                : d.isSelected
                                ? '#ba1a1a'
                                : d.isToday
                                ? '#006c4a'
                                : '#5c403c'
                            }
                          >
                            {d.label}
                          </text>

                          {/* Extra date line for Week view */}
                          {trendViewMode === 'WEEK' && (
                            <text
                              x={pt.x}
                              y={218}
                              textAnchor="middle"
                              fontFamily="Plus Jakarta Sans"
                              fontSize="10"
                              fontWeight={d.isSelected ? '700' : '500'}
                              fill={d.isSelected ? '#ba1a1a' : '#857371'}
                            >
                              {d.displayDate}
                            </text>
                          )}
                        </>
                      ) : (
                        /* Subtle tick dot for days in Month mode */
                        <circle
                          cx={pt.x}
                          cy={197}
                          r={1.5}
                          fill="#94a3b8"
                          opacity={0.6}
                        />
                      )}
                    </g>
                  );
                })}

                {/* Vertical Cursor Guide & Unified Tooltip for Hovered Node */}
                {hoveredPoint !== null && expensePoints[hoveredPoint] && incomePoints[hoveredPoint] && (
                  <g className="transition-all pointer-events-none">
                    {/* Vertical guideline passing directly through the node and label */}
                    <line
                      x1={expensePoints[hoveredPoint].x}
                      y1="25"
                      x2={expensePoints[hoveredPoint].x}
                      y2="185"
                      stroke="#94a3b8"
                      strokeWidth="1.5"
                      strokeDasharray="3 3"
                    />

                    {/* Floating Unified Tooltip Card */}
                    <g
                      transform={`translate(${
                        Math.min(
                          Math.max(10, expensePoints[hoveredPoint].x - 67),
                          535
                        )
                      }, ${Math.min(
                        Math.min(expensePoints[hoveredPoint].y, incomePoints[hoveredPoint].y) - 65,
                        105
                      )})`}
                    >
                      <rect
                        width="135"
                        height="58"
                        rx="8"
                        fill="#131b2e"
                        fillOpacity="0.96"
                        filter="drop-shadow(0 4px 6px rgba(0,0,0,0.15))"
                      />
                      <text x="10" y="16" fill="#94a3b8" fontFamily="Inter" fontSize="10" fontWeight="600">
                        {trendPoints[hoveredPoint].label} ({trendPoints[hoveredPoint].displayDate})
                      </text>
                      <text x="10" y="33" fill="#34d399" fontFamily="Inter" fontSize="11" fontWeight="700">
                        +Thu: {incomePoints[hoveredPoint].income.toLocaleString('vi-VN')}₫
                      </text>
                      <text x="10" y="49" fill="#f87171" fontFamily="Inter" fontSize="11" fontWeight="700">
                        -Chi: {expensePoints[hoveredPoint].expense.toLocaleString('vi-VN')}₫
                      </text>
                    </g>
                  </g>
                )}

                {/* Invisible hover trigger columns for each item */}
                {expensePoints.map((pt, i) => (
                  <rect
                    key={`trigger-${i}`}
                    x={pt.x - stepX / 2}
                    y="0"
                    width={stepX}
                    height="236"
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredPoint(i)}
                    onMouseLeave={() => setHoveredPoint(null)}
                    onClick={() => handleChartPointClick(trendPoints[i])}
                  />
                ))}
              </svg>
            </div>

            {/* Summary Micro Metrics (adaptive to Week / Month / Year) */}
            <div className="grid grid-cols-3 gap-space-sm pt-space-md mt-space-sm bg-surface-container-low/50 rounded-xl p-space-sm border border-outline-variant/10">
              <div className="flex flex-col">
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  {trendViewMode === 'WEEK' ? 'Tổng thu 7 ngày' : trendViewMode === 'MONTH' ? 'Tổng thu tháng' : 'Tổng thu cả năm'}
                </span>
                <span className="font-title-md text-title-md text-secondary font-bold">
                  +{totalPeriodIncome.toLocaleString('vi-VN')}₫
                </span>
              </div>
              <div className="flex flex-col">
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  {trendViewMode === 'WEEK' ? 'Tổng chi 7 ngày' : trendViewMode === 'MONTH' ? 'Tổng chi tháng' : 'Tổng chi cả năm'}
                </span>
                <span className="font-title-md text-title-md text-primary font-bold">
                  -{totalPeriodExpense.toLocaleString('vi-VN')}₫
                </span>
              </div>
              <div className="flex flex-col">
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  {trendViewMode === 'WEEK' ? 'Dòng tiền thuần 7 ngày' : trendViewMode === 'MONTH' ? 'Dòng tiền thuần tháng' : 'Dòng tiền thuần năm'}
                </span>
                <span
                  className={`font-title-md text-title-md font-bold ${
                    netPeriodCashflow >= 0 ? 'text-secondary' : 'text-primary'
                  }`}
                >
                  {netPeriodCashflow >= 0 ? '+' : ''}{netPeriodCashflow.toLocaleString('vi-VN')}₫
                </span>
              </div>
            </div>
          </div>

          {/* Donut Chart & Category Breakdown */}
          <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm flex flex-col border border-outline-variant/20">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-space-md border-b border-outline-variant/20 gap-3">
              {/* Left: Title & Subtitle */}
              <div className="flex items-center gap-space-xs">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-sm ${
                    breakdownType === 'EXPENSE'
                      ? 'bg-error-container text-primary'
                      : 'bg-secondary-fixed/50 text-secondary'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">donut_large</span>
                </div>
                <div>
                  <h2 className="font-title-md text-title-md text-on-surface font-bold">
                    {breakdownType === 'EXPENSE' ? 'Phân bổ chi tiêu' : 'Phân bổ thu nhập'}
                  </h2>
                  <p className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1.5">
                    <span>Tỷ trọng các danh mục trong Tháng {parseInt(calMonth.split('-')[1], 10)}/{calMonth.split('-')[0]}</span>
                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-secondary/10 text-secondary text-[11px] font-semibold">
                      <span className="material-symbols-outlined text-[13px]">sync</span>
                      Theo lịch
                    </span>
                  </p>
                </div>
              </div>

              {/* Right: Controls & Total */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 lg:justify-end">
                {/* Type Switcher: Chi tiêu / Thu nhập */}
                <div className="flex items-center bg-surface-container rounded-xl p-0.5 shadow-xs">
                  <button
                    type="button"
                    onClick={() => setBreakdownType('EXPENSE')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                      breakdownType === 'EXPENSE'
                        ? 'bg-primary text-white shadow-xs'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
                    <span>Chi tiêu</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBreakdownType('INCOME')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                      breakdownType === 'INCOME'
                        ? 'bg-secondary text-white shadow-xs'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">arrow_downward</span>
                    <span>Thu nhập</span>
                  </button>
                </div>

                {/* Total Recorded Amount */}
                <div className="flex flex-col items-end pl-2 border-l border-outline-variant/30">
                  <span className="font-body-sm text-body-sm text-on-surface-variant whitespace-nowrap">
                    {breakdownType === 'EXPENSE' ? 'Tổng chi tiêu ghi nhận' : 'Tổng thu nhập ghi nhận'}
                  </span>
                  <span
                    className={`font-headline-sm text-headline-sm font-bold leading-none ${
                      breakdownType === 'EXPENSE' ? 'text-primary' : 'text-secondary'
                    }`}
                  >
                    {totalBreakdownAmount.toLocaleString('vi-VN')}₫
                  </span>
                </div>
              </div>
            </div>

            {/* Donut Layout & Legend */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-space-lg items-center py-space-md">
              {/* Donut Graphic */}
              <div className="md:col-span-5 flex items-center justify-center relative">
                <div className="relative w-44 h-44 flex items-center justify-center">
                  <svg className="w-full h-full" viewBox="0 0 160 160">
                    {/* Background track */}
                    <circle
                      cx="80"
                      cy="80"
                      r="64"
                      fill="transparent"
                      stroke="#f2f3ff"
                      strokeWidth="20"
                    ></circle>

                    {/* All Category Donut Segments (Render every single recorded category) */}
                    {totalBreakdownAmount > 0 && sortedDonutSegments.map((segment) => {
                      const isHovered = hoveredCategoryName === segment.name;
                      const isAnyHovered = Boolean(hoveredCategoryName);
                      return (
                        <path
                          key={segment.name}
                          d={segment.pathData}
                          fill="none"
                          stroke={segment.color}
                          strokeWidth={isHovered ? 24 : 20}
                          strokeLinecap="butt"
                          opacity={isAnyHovered && !isHovered ? 0.45 : 1}
                          className="transition-all duration-200 cursor-pointer"
                          onMouseEnter={() => setHoveredCategoryName(segment.name)}
                          onMouseLeave={() => setHoveredCategoryName(null)}
                        >
                          <title>{`${segment.name}: ${segment.amount.toLocaleString('vi-VN')}₫ (${segment.percent}%)`}</title>
                        </path>
                      );
                    })}
                  </svg>
                  {/* Donut Inside Center Data */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-2 text-center">
                    <span className="font-label-sm text-label-sm text-on-surface-variant truncate max-w-[110px]">
                      {activeCategory?.name || 'Tổng quan'}
                    </span>
                    <span
                      className={`font-currency-display text-currency-display leading-none ${
                        breakdownType === 'EXPENSE' ? 'text-primary' : 'text-secondary'
                      }`}
                    >
                      {activeCategory ? `${activeCategory.percent}%` : '0%'}
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant text-[11px] truncate max-w-[110px]">
                      {hoveredCategoryName && activeCategory
                        ? `${activeCategory.amount.toLocaleString('vi-VN')}₫`
                        : 'Tập trung'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Donut Summary Chips */}
              <div className="md:col-span-7 flex flex-col gap-space-sm max-h-[300px] overflow-y-auto pr-1">
                {categoryBreakdownList.length === 0 ? (
                  <div className="p-space-md rounded-xl bg-surface-container-low text-center text-sm text-on-surface-variant">
                    {breakdownType === 'EXPENSE'
                      ? 'Chưa có giao dịch chi tiêu nào trong kỳ này.'
                      : 'Chưa có giao dịch thu nhập nào trong kỳ này.'}
                  </div>
                ) : (
                  categoryBreakdownList.map((c, idx) => {
                    const isHovered = hoveredCategoryName === c.name;
                    return (
                      <div
                        key={idx}
                        onMouseEnter={() => setHoveredCategoryName(c.name)}
                        onMouseLeave={() => setHoveredCategoryName(null)}
                        className={`p-space-sm rounded-xl flex items-center justify-between border transition-all cursor-pointer ${
                          isHovered
                            ? 'bg-surface-container-high border-outline-variant shadow-xs scale-[1.01]'
                            : 'bg-surface-container-low border-outline-variant/10 hover:bg-surface-container'
                        }`}
                      >
                        <div className="flex items-center gap-space-xs">
                          <div
                            className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs"
                            style={{ backgroundColor: c.color }}
                          ></div>
                          <span className="font-label-md text-label-md text-on-surface font-semibold">
                            {c.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-space-sm">
                          <span
                            className={`font-currency-row text-currency-row font-bold ${
                              breakdownType === 'EXPENSE' ? 'text-on-surface' : 'text-secondary'
                            }`}
                          >
                            {breakdownType === 'INCOME' ? '+' : ''}{c.amount.toLocaleString('vi-VN')}₫
                          </span>
                          <span
                            className={`px-space-xs py-0.5 rounded font-label-sm text-label-sm font-bold ${
                              idx === 0
                                ? breakdownType === 'EXPENSE'
                                  ? 'bg-primary-fixed text-on-primary-fixed'
                                  : 'bg-secondary-fixed text-on-secondary-fixed'
                                : 'bg-surface-container-high text-on-surface-variant'
                            }`}
                          >
                            {c.percent}%
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Detailed Category Threshold Progress Bars */}
            <div className="pt-space-md flex flex-col gap-space-md border-t border-outline-variant/20">
              <h3 className="font-label-lg text-label-lg font-bold text-on-surface">
                {breakdownType === 'EXPENSE'
                  ? 'Tiến độ chi tiêu các hạng mục chính'
                  : 'Đóng góp thu nhập các hạng mục chính'}
              </h3>

              {categoryBreakdownList.length === 0 ? (
                <div className="p-space-md rounded-xl bg-surface-container-low text-center text-sm text-on-surface-variant">
                  {breakdownType === 'EXPENSE'
                    ? 'Không có dữ liệu chi tiêu để phân tích hạng mục.'
                    : 'Không có dữ liệu thu nhập để phân tích hạng mục.'}
                </div>
              ) : (
                categoryBreakdownList.map((cat, idx) => {
                  const isOver = breakdownType === 'EXPENSE' && cat.percent > 80;
                  return (
                    <div key={idx} className="flex flex-col gap-space-2xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-space-xs">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              isOver
                                ? 'bg-error-container text-on-error-container'
                                : breakdownType === 'EXPENSE'
                                ? 'bg-secondary-fixed/50 text-secondary'
                                : 'bg-secondary-fixed text-secondary'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              {cat.icon || 'category'}
                            </span>
                          </div>
                          <div>
                            <span className="font-title-md text-title-md text-on-surface font-bold">
                              {cat.name}
                            </span>
                            <span
                              className={`font-body-sm text-body-sm block font-semibold ${
                                isOver ? 'text-primary' : 'text-secondary'
                              }`}
                            >
                              {breakdownType === 'EXPENSE'
                                ? isOver
                                  ? 'Chạm ngưỡng chi tiêu cao!'
                                  : 'Kiểm soát hạn mức tốt'
                                : 'Nguồn thu tích cực'}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span
                            className={`font-currency-row text-currency-row font-bold ${
                              isOver
                                ? 'text-primary'
                                : breakdownType === 'EXPENSE'
                                ? 'text-on-surface'
                                : 'text-secondary'
                            }`}
                          >
                            {breakdownType === 'INCOME' ? '+' : ''}{cat.amount.toLocaleString('vi-VN')}₫
                          </span>
                          <span className="text-on-surface-variant font-body-sm text-body-sm block">
                            Tỷ trọng {cat.percent}%
                          </span>
                        </div>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-surface-container-high overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500`}
                          style={{
                            width: `${Math.min(100, Math.max(3, cat.percent))}%`,
                            backgroundColor: cat.color || (isOver ? '#dc2626' : '#006c4a'),
                          }}
                        ></div>
                      </div>
                      <div
                        className={`flex justify-between font-label-sm text-label-sm ${
                          isOver ? 'text-primary font-bold' : 'text-secondary font-semibold'
                        }`}
                      >
                        <span>
                          {cat.percent}% {breakdownType === 'EXPENSE' ? 'tổng chi' : 'tổng thu'}
                        </span>
                        <span>
                          {breakdownType === 'EXPENSE'
                            ? isOver
                              ? 'Cần cân đối chi tiêu'
                              : 'Dư địa dòng tiền ổn định'
                            : 'Đóng góp dòng tiền tốt'}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Interactive Spending Calendar, AI Insights & Risk Ranking (5 Columns) */}
        <div className="lg:col-span-5 flex flex-col gap-space-lg">
          {/* Interactive Heatmap / Calendar Block */}
          <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm border border-outline-variant/20">
            <div className="flex items-center justify-between mb-space-md">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-primary text-[22px]">calendar_month</span>
                <span className="font-headline-sm text-headline-sm text-on-surface font-bold">
                  Lịch chi tiêu {formatCalMonthLabel(calMonth)}
                </span>
              </div>
              <div className="flex items-center gap-1 bg-surface-container rounded-lg p-0.5 relative" ref={pickerRef}>
                <button
                  type="button"
                  onClick={handlePrevCalMonth}
                  title="Tháng trước"
                  className="p-1 rounded hover:bg-surface-container-high transition-colors cursor-pointer text-on-surface-variant flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsMonthPickerOpen(!isMonthPickerOpen)}
                  title="Chọn tháng và năm"
                  className="px-2.5 py-1 rounded-md bg-surface-container-lowest font-label-sm text-label-sm text-on-surface font-semibold shadow-xs hover:bg-surface-container-highest transition-all cursor-pointer flex items-center gap-1"
                >
                  <span>Tháng</span>
                </button>
                <button
                  type="button"
                  onClick={handleNextCalMonth}
                  title="Tháng sau"
                  className="p-1 rounded hover:bg-surface-container-high transition-colors cursor-pointer text-on-surface-variant flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>

                {/* Year & Month Popover */}
                {isMonthPickerOpen && (
                  <div className="absolute right-0 top-full mt-2 w-72 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl shadow-2xl z-50 p-4 animate-in fade-in zoom-in-95">
                    {/* Year Selector Bar */}
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-surface-container-high/60">
                      <button
                        type="button"
                        onClick={() => setPickerYear((prev) => prev - 1)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface-container text-on-surface cursor-pointer transition-colors"
                        title="Năm trước"
                      >
                        <span className="material-symbols-outlined text-lg">chevron_left</span>
                      </button>

                      <div className="flex items-center gap-1.5 font-bold text-on-surface text-base">
                        <span>Năm</span>
                        <select
                          value={pickerYear}
                          onChange={(e) => setPickerYear(Number(e.target.value))}
                          className="bg-surface-container-low px-2 py-0.5 rounded-lg border border-outline-variant/40 font-bold text-primary cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary/40 text-sm"
                        >
                          {Array.from({ length: 31 }, (_, i) => 2015 + i).map((y) => (
                            <option key={y} value={y}>
                              {y}
                            </option>
                          ))}
                        </select>
                      </div>

                      <button
                        type="button"
                        onClick={() => setPickerYear((prev) => prev + 1)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface-container text-on-surface cursor-pointer transition-colors"
                        title="Năm sau"
                      >
                        <span className="material-symbols-outlined text-lg">chevron_right</span>
                      </button>
                    </div>

                    {/* 12 Months Grid */}
                    <div className="grid grid-cols-3 gap-2">
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                        const mStr = `${pickerYear}-${String(m).padStart(2, '0')}`;
                        const isSelected = calMonth === mStr;
                        const now = new Date();
                        const isCurrentMonth = now.getFullYear() === pickerYear && now.getMonth() + 1 === m;

                        return (
                          <button
                            key={m}
                            type="button"
                            onClick={() => {
                              setCalMonth(mStr);
                              setIsMonthPickerOpen(false);
                            }}
                            className={`py-2 px-1 text-xs font-semibold rounded-xl text-center transition-all cursor-pointer relative ${
                              isSelected
                                ? 'bg-primary text-white shadow-sm font-bold scale-105'
                                : 'bg-surface-container-low hover:bg-surface-container text-on-surface'
                            }`}
                          >
                            Tháng {m}
                            {isCurrentMonth && !isSelected && (
                              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-secondary"></span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Footer Quick Action */}
                    <div className="mt-3 pt-2 border-t border-surface-container-high/60 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => {
                          const now = new Date();
                          const cur = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
                          setPickerYear(now.getFullYear());
                          setCalMonth(cur);
                          setIsMonthPickerOpen(false);
                        }}
                        className="text-xs font-bold text-secondary hover:underline cursor-pointer"
                      >
                        Tháng hiện tại
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsMonthPickerOpen(false)}
                        className="text-xs text-on-surface-variant hover:text-on-surface cursor-pointer"
                      >
                        Đóng
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Weekdays Header */}
            <div className="grid grid-cols-7 text-center font-label-sm text-label-sm text-on-surface-variant font-bold mb-2">
              <span>T2</span>
              <span>T3</span>
              <span>T4</span>
              <span>T5</span>
              <span>T6</span>
              <span>T7</span>
              <span className="text-primary">CN</span>
            </div>

            {/* Days Grid with micro cashflows */}
            <div className="grid grid-cols-7 gap-1 text-center text-[11px]">
              {/* Preceding weekday alignment empty cells */}
              {Array.from({ length: startDayOfWeek }).map((_, idx) => (
                <div key={`empty-${idx}`} className="p-1 min-h-[50px] rounded-xl opacity-20 pointer-events-none" />
              ))}

              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const day = idx + 1;
                const flow = dailyCashflows.get(day);
                const isSelected = selectedDay === day;
                const now = new Date();
                const isToday =
                  now.getFullYear() === calendarYear &&
                  now.getMonth() + 1 === calendarMonth &&
                  now.getDate() === day;

                return (
                  <div
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className={`p-1 min-h-[50px] rounded-xl flex flex-col items-center justify-start cursor-pointer transition-all relative ${
                      isSelected
                        ? 'bg-error-container/60 shadow-xs scale-105 z-10 ring-2 ring-primary-container'
                        : isToday
                        ? 'bg-secondary/10 hover:bg-secondary/20'
                        : 'hover:bg-surface-container-low'
                    }`}
                  >
                    {/* Chấm xanh ở ngày hiện tại */}
                    {isToday && (
                      <span
                        className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-secondary shadow-xs ring-1 ring-white"
                        title="Hôm nay"
                      />
                    )}

                    <span
                      className={`font-medium ${
                        isSelected
                          ? 'w-5 h-5 rounded-full bg-primary-container text-on-primary-container font-bold text-[10px] flex items-center justify-center'
                          : isToday
                          ? 'text-secondary font-bold'
                          : 'text-on-surface'
                      }`}
                    >
                      {day}
                    </span>

                    {/* Micro Cashflows on calendar cell */}
                    {flow && flow.income > 0 && (
                      <span className="text-secondary font-bold text-[9px] leading-tight mt-0.5">
                        +{flow.income >= 1_000_000 ? `${(flow.income / 1_000_000).toFixed(1)}M` : `${Math.round(flow.income / 1000)}k`}
                      </span>
                    )}
                    {flow && flow.expense > 0 && (
                      <span className="text-primary font-bold text-[9px] leading-tight mt-0.5">
                        -{flow.expense >= 1_000_000 ? `${(flow.expense / 1_000_000).toFixed(1)}M` : `${Math.round(flow.expense / 1000)}k`}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Action Bar: Detail Button & Quick Day Indicator */}
            <div className="mt-space-md pt-space-sm border-t border-outline-variant/20 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                <span className="material-symbols-outlined text-[16px] text-primary">event</span>
                <span className="font-semibold text-on-surface">
                  Ngày {String(selectedDay).padStart(2, '0')}/{calMonth.split('-')[1]}:
                </span>
                <span className="px-2 py-0.5 rounded-full bg-surface-container-high font-medium text-[11px]">
                  {selectedDayTransactions.length} giao dịch
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-primary text-on-primary font-label-sm text-label-sm font-semibold flex items-center gap-1.5 shadow-sm hover:opacity-90 active:scale-95 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">visibility</span>
                <span>Xem chi tiết</span>
              </button>
            </div>
          </div>

          {/* Top Expense Ranking Ledger Card */}
          <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm flex flex-col border border-outline-variant/20">
            <div className="flex items-center justify-between pb-space-md border-b border-outline-variant/20">
              <div className="flex items-center gap-space-xs">
                <div className="w-9 h-9 rounded-xl bg-surface-container-high flex items-center justify-center text-primary shadow-sm">
                  <span className="material-symbols-outlined text-[20px]">leaderboard</span>
                </div>
                <div>
                  <h2 className="font-title-md text-title-md text-on-surface font-bold">
                    Top khoản chi lớn nhất
                  </h2>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Kiểm soát các giao dịch trọng yếu
                  </p>
                </div>
              </div>
              <span className="text-tertiary font-label-sm text-label-sm font-semibold">
                {topExpensesList.length} khoản chi
              </span>
            </div>

            {/* Ledger Items */}
            <div className="flex flex-col gap-space-sm pt-space-md">
              {topExpensesList.length === 0 ? (
                <div className="p-6 text-center text-on-surface-variant text-sm bg-surface-container-low rounded-xl">
                  Chưa có khoản chi nào được ghi nhận trong khoảng thời gian này.
                </div>
              ) : (
                topExpensesList.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="flex items-center justify-between p-space-sm rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors border border-outline-variant/10"
                  >
                    <div className="flex items-center gap-space-sm">
                      <span
                        className={`w-5 text-center font-headline-sm text-headline-sm font-bold ${
                          idx === 0 ? 'text-primary' : 'text-on-surface-variant'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          idx === 0
                            ? 'bg-error-container text-on-error-container'
                            : 'bg-surface-container-high text-on-surface'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          {item.categoryIcon}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-label-lg text-label-lg text-on-surface font-semibold truncate max-w-[180px]">
                          {item.note}
                        </span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">
                          {item.date} • {item.accountName}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-currency-row text-currency-row text-primary block">
                        -{item.amount.toLocaleString('vi-VN')}₫
                      </span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant block">
                        {item.percent}% chi tiêu
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* AI Intelligence Financial Tip Card */}
          <div className="bg-gradient-to-br from-tertiary-fixed/30 via-surface-container-lowest to-surface-container-low rounded-2xl p-space-lg shadow-sm border border-tertiary/20 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-tertiary">
              <span className="material-symbols-outlined text-[22px]">neurology</span>
              <h3 className="font-title-md text-title-md font-bold">Gợi ý từ Trợ lý FinMan AI</h3>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
              {surplus >= 0
                ? `Thặng dư hiện tại của bạn đạt ${savingsRate}% thu nhập. Để tối ưu hóa lợi nhuận, bạn có thể chuyển một phần dòng tiền nhàn rỗi vào tài khoản tiết kiệm có kỳ hạn hoặc quỹ đầu tư sinh lời.`
                : 'Ngân sách đang có dấu hiệu thâm hụt. Hãy tận dụng tính năng đặt Hạn mức Ngân sách tại mục Quản lý Ngân sách để được cảnh báo tự động khi chi tiêu chạm ngưỡng 80%.'}
            </p>
            <div className="pt-2 flex justify-between items-center text-xs font-semibold text-tertiary border-t border-tertiary/10">
              <span>Được tính toán bởi FinMan Analytics Engine</span>
              <span className="material-symbols-outlined text-[16px]">trending_up</span>
            </div>
          </div>
        </div>
      </div>

      {/* Popup Modal: Chi tiết giao dịch ngày được chọn */}
      {isDetailModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 max-w-lg w-full shadow-2xl relative flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-surface-container-high/60">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-error-container/60 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[22px]">calendar_today</span>
                </div>
                <div>
                  <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                    Giao dịch ngày {String(selectedDay).padStart(2, '0')}/{calMonth.split('-')[1]}/{calendarYear}
                  </h3>
                  <span className="text-xs text-on-surface-variant font-medium">
                    {selectedDayTransactions.length} giao dịch được ghi nhận
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface flex items-center justify-center transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Quick Flow Summary Chips */}
            <div className="grid grid-cols-2 gap-3 my-4">
              <div className="p-3 rounded-xl bg-secondary-fixed/30 border border-secondary/20 flex flex-col">
                <span className="text-xs font-semibold text-secondary flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px]">arrow_downward</span>
                  Tổng thu trong ngày
                </span>
                <span className="font-currency-row text-sm font-bold text-secondary mt-1">
                  +{selectedDayFlow.income.toLocaleString('vi-VN')} ₫
                </span>
              </div>
              <div className="p-3 rounded-xl bg-error-container/40 border border-primary/20 flex flex-col">
                <span className="text-xs font-semibold text-primary flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px]">arrow_upward</span>
                  Tổng chi trong ngày
                </span>
                <span className="font-currency-row text-sm font-bold text-primary mt-1">
                  -{selectedDayFlow.expense.toLocaleString('vi-VN')} ₫
                </span>
              </div>
            </div>

            {/* Transaction List */}
            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2 min-h-[140px]">
              {selectedDayTransactions.length === 0 ? (
                <div className="py-10 text-center flex flex-col items-center justify-center text-on-surface-variant">
                  <div className="w-12 h-12 rounded-full bg-surface-container-low flex items-center justify-center mb-2 text-on-surface-variant/60">
                    <span className="material-symbols-outlined text-[26px]">receipt_long</span>
                  </div>
                  <p className="text-sm font-semibold text-on-surface">Không phát sinh giao dịch</p>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Không phát sinh khoản thu hay chi nào vào ngày {selectedDay}/{calMonth.split('-')[1]}.
                  </p>
                </div>
              ) : (
                selectedDayTransactions.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors border border-outline-variant/10"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-sm text-primary shrink-0">
                        <span className="material-symbols-outlined text-[20px]">
                          {t.category?.icon || 'payments'}
                        </span>
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-on-surface">
                          {t.note || t.category?.name || 'Giao dịch'}
                        </div>
                        <div className="text-xs text-on-surface-variant mt-0.5">
                          {t.account?.name || 'Tài khoản'} • {t.category?.name || 'Chung'}
                          {t.time ? ` • ${t.time}` : ''}
                        </div>
                      </div>
                    </div>
                    <div
                      className={`font-currency-row text-sm font-bold shrink-0 ${
                        t.type === 'INCOME' ? 'text-secondary' : 'text-primary'
                      }`}
                    >
                      {t.type === 'INCOME' ? '+' : '-'}
                      {t.amount.toLocaleString('vi-VN')} ₫
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-surface-container-high/60 flex justify-end">
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-surface-container-high text-on-surface font-label-md text-label-md font-semibold hover:bg-surface-container-highest transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
