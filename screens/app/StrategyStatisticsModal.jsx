import React from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

// Requires: npx expo install react-native-svg
import Svg, {
  Polyline,
  Line,
  Text as SvgText,
} from 'react-native-svg';

const COLORS = {
  navy: '#0F1B3D',
  blue: '#2F6FED',
  green: '#22C55E',
  red: '#EF4444',
  textDark: '#0F1B2A',
  textGray: '#8A93A6',
  bg: '#F5F6FA',
  cardBg: '#FFFFFF',
  border: '#ECEEF3',
};

function formatINR(value) {
  const num = Number(value ?? 0);
  const sign = num < 0 ? '-' : '';

  return `${sign}₹${Math.abs(num).toLocaleString('en-IN', {
    maximumFractionDigits: 2,
  })}`;
}

function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();

  const diff =
    d.getDate() -
    day +
    (day === 0 ? -6 : 1);

  return new Date(d.setDate(diff));
}

function toISODate(d) {
  return new Date(d).toISOString().split('T')[0];
}

/* =========================================================
   DATE FORMATTING FOR PDF
========================================================= */

function formatDayDate(date) {
  const d = new Date(date);

  const year = d.getFullYear();

  const month = d.toLocaleString('en-US', {
    month: 'long',
  });

  const day = String(d.getDate()).padStart(2, '0');

  return `${year} - ${month} - ${day}`;
}

function formatMonth(monthStr) {
  const [year, month] = monthStr.split('-');

  const monthName = new Date(
    `${year}-${month}-01`
  ).toLocaleString('en-US', {
    month: 'long',
  });

  return `${year} - ${monthName}`;
}

/* =========================================================
   EQUITY CURVE
========================================================= */

function EquityCurveChart({ data }) {
  const width = 320;
  const height = 160;

  const paddingLeft = 44;
  const paddingBottom = 24;

  const chartWidth = width - paddingLeft;
  const chartHeight = height - paddingBottom;

  if (data.length === 0) {
    return (
      <Text
        style={{
          color: COLORS.textGray,
          fontSize: 12,
          paddingVertical: 20,
        }}
      >
        No equity data yet
      </Text>
    );
  }

  const values = data.map((d) => d.equity);

  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);

  const range = maxVal - minVal || 1;

  const points = data
    .map((d, i) => {
      const x =
        paddingLeft +
        (i / Math.max(data.length - 1, 1)) *
          chartWidth;

      const y =
        chartHeight -
        ((d.equity - minVal) / range) *
          chartHeight;

      return `${x},${y}`;
    })
    .join(' ');

  const gridLines = 4;

  return (
    <Svg width={width} height={height}>
      {Array.from({
        length: gridLines + 1,
      }).map((_, i) => {
        const y =
          (chartHeight / gridLines) * i;

        const value =
          maxVal -
          (range / gridLines) * i;

        return (
          <React.Fragment key={i}>
            <Line
              x1={paddingLeft}
              y1={y}
              x2={width}
              y2={y}
              stroke={COLORS.border}
              strokeWidth={1}
              strokeDasharray="4,4"
            />

            <SvgText
              x={paddingLeft - 6}
              y={y + 4}
              fontSize={9}
              fill={COLORS.textGray}
              textAnchor="end"
            >
              {`₹${Math.round(value / 1000)}k`}
            </SvgText>
          </React.Fragment>
        );
      })}

      <Polyline
        points={points}
        fill="none"
        stroke={COLORS.navy}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {data.map((d, i) => {
        if (
          i % 2 !== 0 &&
          i !== data.length - 1
        ) {
          return null;
        }

        const x =
          paddingLeft +
          (i / Math.max(data.length - 1, 1)) *
            chartWidth;

        return (
          <SvgText
            key={d.date + i}
            x={x}
            y={height - 6}
            fontSize={8}
            fill={COLORS.textGray}
            textAnchor="middle"
          >
            {d.date}
          </SvgText>
        );
      })}
    </Svg>
  );
}

/* =========================================================
   PDF DOWNLOAD
========================================================= */
const downloadStrategyReport = async (statistics) => {
  try {
    const {
      daily = [],
      monthly = [],
      strategy = {},
    } = statistics || {};

    const capital = parseFloat(
      strategy.capital_required || 0
    );

    /* =========================
       PERCENTAGE CALCULATION
    ========================= */

    const getPct = (pnl) => {
      if (!capital) {
        return 0;
      }

      return (pnl / capital) * 100;
    };

    /* =========================
       DAY-WISE ROWS
    ========================= */

    const dayRows = daily
      .map((d) => {
        const val = parseFloat(
          d.day_pnl || 0
        );

        const pct = getPct(val);

        return `
          <tr>
            <td>
              ${formatDayDate(d.date)}
            </td>

            <td class="${val >= 0 ? 'profit' : 'loss'}">
              ₹ ${val.toFixed(2)}
            </td>

            <td class="${pct >= 0 ? 'profit' : 'loss'}">
              ${pct.toFixed(2)}%
            </td>
          </tr>
        `;
      })
      .join('');

    /* =========================
       MONTH-WISE ROWS
    ========================= */

    const monthRows = monthly
      .map((m) => {
        const val = parseFloat(
          m.monthly_return || 0
        );

        const pct = getPct(val);

        return `
          <tr>
            <td>
              ${formatMonth(m.month)}
            </td>

            <td class="${val >= 0 ? 'profit' : 'loss'}">
              ₹ ${val.toFixed(2)}
            </td>

            <td class="${pct >= 0 ? 'profit' : 'loss'}">
              ${pct.toFixed(2)}%
            </td>
          </tr>
        `;
      })
      .join('');

    /* =========================
       HTML PDF
    ========================= */

    const html = `
      <!DOCTYPE html>

      <html>

        <head>

          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />

          <style>

            * {
              box-sizing: border-box;
            }

            body {
              font-family: Arial, Helvetica, sans-serif;
              padding: 30px;
              color: #0F1B2A;
              background: #ffffff;
            }

            h1 {
              font-size: 24px;
              margin: 0 0 20px 0;
              color: #0F1B3D;
            }

            .strategy-info {
              margin-bottom: 25px;
              padding: 15px;
              background: #F5F6FA;
              border-radius: 8px;
            }

            .strategy-info p {
              margin: 6px 0;
              font-size: 14px;
            }

            .section-title {
              font-size: 17px;
              font-weight: bold;
              margin-top: 25px;
              margin-bottom: 10px;
              color: #0F1B3D;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 8px;
            }

            th {
              background: #0F1B3D;
              color: white;
              font-weight: bold;
              padding: 10px;
              text-align: left;
              font-size: 13px;
            }

            td {
              border: 1px solid #ECEEF3;
              padding: 9px;
              font-size: 12px;
            }

            tr:nth-child(even) {
              background: #F8F9FB;
            }

            .profit {
              color: #16A34A;
              font-weight: bold;
            }

            .loss {
              color: #DC2626;
              font-weight: bold;
            }

            .empty {
              padding: 15px;
              color: #8A93A6;
              text-align: center;
            }

            .footer {
              margin-top: 30px;
              padding-top: 15px;
              border-top: 1px solid #ECEEF3;
              color: #8A93A6;
              font-size: 11px;
            }

          </style>

        </head>

        <body>

          <h1>
            Strategy Report
          </h1>

          <div class="strategy-info">

            <p>
              <strong>Strategy:</strong>
              ${strategy.name || '-'}
            </p>

            <p>
              <strong>Capital:</strong>
              ₹ ${capital.toFixed(2)}
            </p>

          </div>

          <div class="section-title">
            Day-Wise Returns
          </div>

          ${
            daily.length > 0
              ? `
                <table>

                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>PnL</th>
                      <th>Return %</th>
                    </tr>
                  </thead>

                  <tbody>
                    ${dayRows}
                  </tbody>

                </table>
              `
              : `
                <div class="empty">
                  No daily trading data available.
                </div>
              `
          }

          <div class="section-title">
            Month-Wise Returns
          </div>

          ${
            monthly.length > 0
              ? `
                <table>

                  <thead>
                    <tr>
                      <th>Month</th>
                      <th>PnL</th>
                      <th>Return %</th>
                    </tr>
                  </thead>

                  <tbody>
                    ${monthRows}
                  </tbody>

                </table>
              `
              : `
                <div class="empty">
                  No monthly trading data available.
                </div>
              `
          }

          <div class="footer">
            Generated by Dreamin Algo
          </div>

        </body>

      </html>
    `;

    /* =========================
       GENERATE PDF
    ========================= */

    console.log(
      'Generating strategy report PDF...'
    );

    const { uri } =
      await Print.printToFileAsync({
        html,
      });

    if (!uri) {
      throw new Error(
        'PDF URI was not generated'
      );
    }

    console.log(
      'PDF generated:',
      uri
    );

    /* =========================
       CHECK SHARING
    ========================= */

    const canShare =
      await Sharing.isAvailableAsync();

    if (!canShare) {
      Alert.alert(
        'PDF Generated',
        'The strategy report was generated successfully, but sharing is not available on this device.'
      );

      return;
    }

    /* =========================
       SHARE PDF
    ========================= */

    console.log(
      'Opening PDF share dialog...'
    );

    await Sharing.shareAsync(
      uri,
      {
        mimeType: 'application/pdf',
        dialogTitle: 'Save Strategy Report',
        UTI: '.pdf',
      }
    );

    console.log(
      'PDF share completed.'
    );

  } catch (error) {

    console.log(
      'PDF DOWNLOAD ERROR:',
      error
    );

    Alert.alert(
      'Download Failed',
      'Unable to generate the strategy report PDF.'
    );
  }
};
/* =========================================================
   MAIN MODAL
========================================================= */

export default function StrategyStatisticsModal({
  visible,
  onClose,
  statistics,
}) {
  const [weekIndex, setWeekIndex] =
    React.useState(0);

  const [weekMenuOpen, setWeekMenuOpen] =
    React.useState(false);

  const [downloading, setDownloading] =
    React.useState(false);

  if (!statistics) return null;

  const daily =
    statistics?.daily || [];

  const monthly =
    statistics?.monthly || [];

  const strategy =
    statistics?.strategy || {};

  const capital = parseFloat(
    strategy.capital_required || 0
  );

  /* =====================================================
     BASIC STATISTICS
  ===================================================== */

  const dayPnls = daily.length
    ? daily.map((d) =>
        parseFloat(d.day_pnl || 0)
      )
    : [0];

  const totalDays =
    dayPnls.length;

  const maxProfit =
    Math.max(...dayPnls);

  const maxLoss =
    Math.min(...dayPnls);

  const winDays =
    dayPnls.filter(
      (p) => p > 0
    ).length;

  const lossDays =
    dayPnls.filter(
      (p) => p < 0
    ).length;

  const winRate = totalDays
    ? (winDays / totalDays) * 100
    : 0;

  const totalPnl = parseFloat(
    statistics.summary?.total_pnl || 0
  );

  const totalTrades = parseInt(
    statistics.summary?.total_trades || 0,
    10
  );

  const profits =
    dayPnls.filter(
      (p) => p > 0
    );

  const losses =
    dayPnls.filter(
      (p) => p < 0
    );

  const avgDaily = totalDays
    ? totalPnl / totalDays
    : 0;

  const avgProfitDays =
    profits.length
      ? profits.reduce(
          (a, b) => a + b,
          0
        ) / profits.length
      : 0;

  const avgLossDays =
    losses.length
      ? losses.reduce(
          (a, b) => a + b,
          0
        ) / losses.length
      : 0;

  const avgMonthly =
    monthly.length
      ? monthly.reduce(
          (a, m) =>
            a +
            parseFloat(
              m.monthly_return || 0
            ),
          0
        ) / monthly.length
      : 0;

  /* =====================================================
     WIN / LOSS STREAK
  ===================================================== */

  let maxWinStreak = 0;
  let maxLossStreak = 0;

  let winStreak = 0;
  let lossStreak = 0;

  dayPnls.forEach((p) => {
    if (p > 0) {
      winStreak++;
      lossStreak = 0;
    } else if (p < 0) {
      lossStreak++;
      winStreak = 0;
    } else {
      winStreak = 0;
      lossStreak = 0;
    }

    if (
      winStreak >
      maxWinStreak
    ) {
      maxWinStreak =
        winStreak;
    }

    if (
      lossStreak >
      maxLossStreak
    ) {
      maxLossStreak =
        lossStreak;
    }
  });

  const getPct = (pnl) => {
    if (!capital) return 0;

    return (
      (pnl / capital) *
      100
    );
  };

  /* =====================================================
     EQUITY CURVE
  ===================================================== */

  const equityCurveData = [];

  let runningEquity =
    capital;

  [...daily]
    .sort(
      (a, b) =>
        new Date(a.date) -
        new Date(b.date)
    )
    .forEach((d) => {
      runningEquity +=
        parseFloat(
          d.day_pnl || 0
        );

      const dt =
        new Date(d.date);

      equityCurveData.push({
        date: `${dt.getDate()} ${dt.toLocaleString(
          'en-US',
          {
            month: 'short',
          }
        )}`,
        equity: Number(
          runningEquity.toFixed(2)
        ),
      });
    });

  /* =====================================================
     WEEKLY GROUPING
  ===================================================== */

  const weekMap = {};

  daily.forEach((d) => {
    const dateObj =
      new Date(d.date);

    const weekStart =
      toISODate(
        getWeekStart(
          dateObj
        )
      );

    if (!weekMap[weekStart]) {
      weekMap[weekStart] = {};
    }

    const dayName =
      dateObj.toLocaleString(
        'en-US',
        {
          weekday: 'short',
        }
      );

    weekMap[weekStart][
      dayName
    ] = {
      pnl: parseFloat(
        d.day_pnl || 0
      ),
      date: toISODate(
        dateObj
      ),
    };
  });

  const weekOptions =
    Object.keys(weekMap)
      .sort(
        (a, b) =>
          new Date(b) -
          new Date(a)
      )
      .map((w) => ({
        value: w,
        label: `Week of ${w}`,
      }));

  const daysOrder = [
    'Mon',
    'Tue',
    'Wed',
    'Thu',
    'Fri',
  ];

  const selectedWeek =
    weekOptions[weekIndex];

  const selectedWeekData =
    selectedWeek
      ? weekMap[
          selectedWeek.value
        ]
      : {};

  /* =====================================================
     DETAILED STATS
  ===================================================== */

  const detailedStats = [
    {
      label: 'Total Win Days',
      value: `${winDays}`,
    },
    {
      label: 'Win Rate',
      value: `${winRate.toFixed(2)}%`,
      color:
        winRate >= 50
          ? COLORS.green
          : COLORS.red,
    },
    {
      label: 'Total Loss Days',
      value: `${lossDays}`,
    },
    {
      label: 'Max Winning Streak',
      value: `${maxWinStreak}`,
    },
    {
      label: 'Max Losing Streak',
      value: `${maxLossStreak}`,
    },
    {
      label: 'Avg Monthly Profit',
      value: formatINR(
        avgMonthly
      ),
      color:
        avgMonthly >= 0
          ? COLORS.green
          : COLORS.red,
    },
    {
      label: 'Total Profit',
      value: formatINR(
        totalPnl
      ),
      color:
        totalPnl >= 0
          ? COLORS.green
          : COLORS.red,
    },
    {
      label: 'Max Profit (Day)',
      value: formatINR(
        maxProfit
      ),
      color: COLORS.green,
    },
    {
      label: 'Max Loss (Day)',
      value: formatINR(
        maxLoss
      ),
      color: COLORS.red,
    },
    {
      label: 'Avg Daily PnL',
      value: formatINR(
        avgDaily
      ),
      color:
        avgDaily >= 0
          ? COLORS.green
          : COLORS.red,
    },
    {
      label:
        'Avg Profit (Winning Days)',
      value: formatINR(
        avgProfitDays
      ),
      color: COLORS.green,
    },
    {
      label:
        'Avg Loss (Losing Days)',
      value: formatINR(
        avgLossDays
      ),
      color: COLORS.red,
    },
  ];

  /* =====================================================
     PDF HANDLER
  ===================================================== */

  const handleDownloadPDF =
    async () => {
      if (downloading) return;

      setDownloading(true);

      try {
        await downloadStrategyReport(
          statistics
        );
      } finally {
        setDownloading(false);
      }
    };

  /* =====================================================
     UI
  ===================================================== */

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={
        onClose
      }
    >
      <View
        style={styles.backdrop}
      >
        <SafeAreaView
          style={styles.sheet}
          edges={['bottom']}
        >

          {/* ================= HEADER ================= */}

          <View
            style={styles.header}
          >
            <Text
              style={
                styles.headerTitle
              }
            >
              Strategy Statistics
            </Text>

            <View
              style={
                styles.rowStart
              }
            >

              {/* DOWNLOAD */}

              <TouchableOpacity
                style={[
                  styles.downloadButton,
                  downloading &&
                    styles.downloadButtonDisabled,
                ]}
                activeOpacity={0.85}
                onPress={
                  handleDownloadPDF
                }
                disabled={
                  downloading
                }
              >
                <Feather
                  name={
                    downloading
                      ? 'loader'
                      : 'download'
                  }
                  size={16}
                  color={
                    COLORS.blue
                  }
                />
              </TouchableOpacity>

              {/* CLOSE */}

              <TouchableOpacity
                onPress={
                  onClose
                }
                hitSlop={10}
                style={
                  styles.closeButton
                }
              >
                <Feather
                  name="x"
                  size={20}
                  color={
                    COLORS.textDark
                  }
                />
              </TouchableOpacity>

            </View>
          </View>

          {/* ================= CONTENT ================= */}

          <ScrollView
            contentContainerStyle={
              styles.scrollContent
            }
            showsVerticalScrollIndicator={
              false
            }
          >

            {/* SUMMARY */}

            <View
              style={
                styles.cardRow
              }
            >

              <View
                style={
                  styles.summaryCard
                }
              >
                <Text
                  style={
                    styles.summaryCardLabel
                  }
                >
                  Total PnL
                </Text>

                <Text
                  style={[
                    styles.summaryCardValue,
                    {
                      color:
                        totalPnl >= 0
                          ? COLORS.green
                          : COLORS.red,
                    },
                  ]}
                >
                  {formatINR(
                    totalPnl
                  )}
                </Text>
              </View>

              <View
                style={[
                  styles.summaryCard,
                  {
                    marginRight: 0,
                  },
                ]}
              >
                <Text
                  style={
                    styles.summaryCardLabel
                  }
                >
                  Total Trading Days
                </Text>

                <Text
                  style={
                    styles.summaryCardValue
                  }
                >
                  {totalTrades}
                </Text>
              </View>

            </View>

            <View
              style={
                styles.cardRow
              }
            >

              <View
                style={
                  styles.summaryCard
                }
              >
                <Text
                  style={
                    styles.summaryCardLabel
                  }
                >
                  Max Profit (Day)
                </Text>

                <Text
                  style={[
                    styles.summaryCardValue,
                    {
                      color:
                        COLORS.green,
                    },
                  ]}
                >
                  {formatINR(
                    maxProfit
                  )}
                </Text>
              </View>

              <View
                style={[
                  styles.summaryCard,
                  {
                    marginRight: 0,
                  },
                ]}
              >
                <Text
                  style={
                    styles.summaryCardLabel
                  }
                >
                  Max Loss (Day)
                </Text>

                <Text
                  style={[
                    styles.summaryCardValue,
                    {
                      color:
                        COLORS.red,
                    },
                  ]}
                >
                  {formatINR(
                    maxLoss
                  )}
                </Text>
              </View>

            </View>

            {/* EQUITY CURVE */}

            <Text
              style={
                styles.sectionTitle
              }
            >
              Equity Curve
            </Text>

            <View
              style={[
                styles.sectionCard,
                {
                  alignItems:
                    'center',
                  paddingVertical: 10,
                },
              ]}
            >
              <EquityCurveChart
                data={
                  equityCurveData
                }
              />
            </View>

            {/* STRATEGY OVERVIEW */}

            <Text
              style={
                styles.sectionTitle
              }
            >
              Strategy Overview
            </Text>

            <View
              style={
                styles.sectionCard
              }
            >

              <View
                style={
                  styles.detailRow
                }
              >
                <Text
                  style={
                    styles.detailLabel
                  }
                >
                  Strategy Name
                </Text>

                <Text
                  style={
                    styles.detailValueWrap
                  }
                  numberOfLines={2}
                >
                  {strategy.name ||
                    '-'}
                </Text>
              </View>

              <View
                style={
                  styles.detailRow
                }
              >
                <Text
                  style={
                    styles.detailLabel
                  }
                >
                  Capital Required
                </Text>

                <Text
                  style={
                    styles.detailValue
                  }
                >
                  {formatINR(
                    capital
                  )}
                </Text>
              </View>

              <View
                style={[
                  styles.detailRow,
                  {
                    borderBottomWidth: 0,
                  },
                ]}
              >
                <Text
                  style={
                    styles.detailLabel
                  }
                >
                  Total Trading Days
                </Text>

                <Text
                  style={
                    styles.detailValue
                  }
                >
                  {totalDays}
                </Text>
              </View>

            </View>

            {/* WEEKLY RETURNS */}

            {weekOptions.length >
              0 && (
              <>
                <Text
                  style={
                    styles.sectionTitle
                  }
                >
                  Weekly Returns
                </Text>

                <TouchableOpacity
                  style={
                    styles.weekDropdown
                  }
                  onPress={() =>
                    setWeekMenuOpen(
                      (v) => !v
                    )
                  }
                  activeOpacity={
                    0.85
                  }
                >
                  <Text
                    style={
                      styles.weekDropdownText
                    }
                  >
                    {
                      selectedWeek?.label
                    }
                  </Text>

                  <Feather
                    name={
                      weekMenuOpen
                        ? 'chevron-up'
                        : 'chevron-down'
                    }
                    size={16}
                    color={
                      COLORS.textGray
                    }
                  />
                </TouchableOpacity>

                {weekMenuOpen && (
                  <View
                    style={
                      styles.weekMenu
                    }
                  >
                    {weekOptions.map(
                      (
                        week,
                        index
                      ) => (
                        <TouchableOpacity
                          key={
                            week.value
                          }
                          style={
                            styles.weekMenuItem
                          }
                          onPress={() => {
                            setWeekIndex(
                              index
                            );

                            setWeekMenuOpen(
                              false
                            );
                          }}
                        >
                          <Text
                            style={
                              styles.weekMenuItemText
                            }
                          >
                            {
                              week.label
                            }
                          </Text>
                        </TouchableOpacity>
                      )
                    )}
                  </View>
                )}

                <View
                  style={[
                    styles.sectionCard,
                    {
                      marginTop: 10,
                    },
                  ]}
                >
                  {daysOrder.map(
                    (
                      day,
                      index
                    ) => {
                      const d =
                        selectedWeekData?.[
                          day
                        ];

                      return (
                        <View
                          key={
                            day
                          }
                          style={[
                            styles.detailRow,
                            index ===
                              daysOrder.length -
                                1 && {
                              borderBottomWidth: 0,
                            },
                          ]}
                        >
                          <View>
                            <Text
                              style={
                                styles.dayLabel
                              }
                            >
                              {
                                day
                              }
                            </Text>

                            <Text
                              style={
                                styles.dayDate
                              }
                            >
                              {d
                                ? d.date
                                : '-'}
                            </Text>
                          </View>

                          <Text
                            style={[
                              styles.detailValue,
                              {
                                color:
                                  d
                                    ? d.pnl >=
                                      0
                                      ? COLORS.green
                                      : COLORS.red
                                    : COLORS.textGray,
                              },
                            ]}
                          >
                            {d
                              ? `${formatINR(
                                  d.pnl
                                )} (${getPct(
                                  d.pnl
                                ).toFixed(
                                  2
                                )}%)`
                              : '-'}
                          </Text>
                        </View>
                      );
                    }
                  )}
                </View>
              </>
            )}

            {/* MONTHLY RETURNS */}

            {monthly.length >
              0 && (
              <>
                <Text
                  style={
                    styles.sectionTitle
                  }
                >
                  Monthly Returns
                </Text>

                <View
                  style={
                    styles.sectionCard
                  }
                >
                  {monthly.map(
                    (
                      m,
                      index
                    ) => {
                      const val =
                        parseFloat(
                          m.monthly_return ||
                            0
                        );

                      const [
                        year,
                        month,
                      ] =
                        m.month.split(
                          '-'
                        );

                      const monthName =
                        new Date(
                          `${year}-${month}-01`
                        ).toLocaleString(
                          'en-US',
                          {
                            month:
                              'short',
                          }
                        );

                      return (
                        <View
                          key={
                            m.month
                          }
                          style={[
                            styles.detailRow,
                            index ===
                              monthly.length -
                                1 && {
                              borderBottomWidth: 0,
                            },
                          ]}
                        >
                          <Text
                            style={
                              styles.detailLabel
                            }
                          >
                            {`${year}-${monthName}`}
                          </Text>

                          <Text
                            style={[
                              styles.detailValue,
                              {
                                color:
                                  val >=
                                  0
                                    ? COLORS.green
                                    : COLORS.red,
                              },
                            ]}
                          >
                            {`${formatINR(
                              val
                            )} (${getPct(
                              val
                            ).toFixed(
                              2
                            )}%)`}
                          </Text>
                        </View>
                      );
                    }
                  )}
                </View>
              </>
            )}

            {/* DETAILED STATS */}

            <Text
              style={
                styles.sectionTitle
              }
            >
              Detailed Stats
            </Text>

            <View
              style={[
                styles.sectionCard,
                {
                  marginBottom: 8,
                },
              ]}
            >
              {detailedStats.map(
                (
                  s,
                  index
                ) => (
                  <View
                    key={
                      s.label
                    }
                    style={[
                      styles.detailRow,
                      index ===
                        detailedStats.length -
                          1 && {
                        borderBottomWidth: 0,
                      },
                    ]}
                  >
                    <Text
                      style={
                        styles.detailLabel
                      }
                    >
                      {s.label}
                    </Text>

                    <Text
                      style={[
                        styles.detailValue,
                        s.color && {
                          color:
                            s.color,
                        },
                      ]}
                    >
                      {s.value}
                    </Text>
                  </View>
                )
              )}
            </View>

          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

/* =========================================================
   STYLES
========================================================= */

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor:
      'rgba(0,0,0,0.35)',
    paddingTop: 44,
  },

  sheet: {
    flex: 1,
    backgroundColor:
      COLORS.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },

  rowStart: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor:
      COLORS.cardBg,
    borderBottomWidth: 1,
    borderBottomColor:
      COLORS.border,
  },

  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textDark,
  },

  downloadButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor:
      '#E9F0FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  downloadButtonDisabled: {
    opacity: 0.5,
  },

  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },

  scrollContent: {
    padding: 20,
  },

  cardRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },

  summaryCard: {
    flex: 1,
    backgroundColor:
      COLORS.cardBg,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    borderRadius: 14,
    padding: 14,
    marginRight: 10,
  },

  summaryCardLabel: {
    fontSize: 11,
    color: COLORS.textGray,
    marginBottom: 6,
  },

  summaryCardValue: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textDark,
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textDark,
    marginTop: 12,
    marginBottom: 10,
  },

  sectionCard: {
    backgroundColor:
      COLORS.cardBg,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 14,
  },

  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor:
      COLORS.border,
  },

  detailLabel: {
    fontSize: 12,
    color: COLORS.textGray,
    flexShrink: 1,
    marginRight: 10,
  },

  detailValue: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textDark,
  },

  detailValueWrap: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textDark,
    flex: 1,
    textAlign: 'right',
  },

  dayLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textDark,
  },

  dayDate: {
    fontSize: 11,
    color: COLORS.textGray,
    marginTop: 1,
  },

  weekDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
    borderWidth: 1,
    borderColor:
      COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 46,
    backgroundColor:
      COLORS.cardBg,
  },

  weekDropdownText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textDark,
  },

  weekMenu: {
    borderWidth: 1,
    borderColor:
      COLORS.border,
    borderRadius: 12,
    marginTop: 6,
    overflow: 'hidden',
    backgroundColor:
      COLORS.cardBg,
  },

  weekMenuItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor:
      COLORS.border,
  },

  weekMenuItemText: {
    fontSize: 13,
    color: COLORS.textDark,
  },
});