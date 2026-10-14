import React, { useState, useMemo } from "react";
import { Calculator, IndianRupee, PieChart, Info, ChevronDown, ChevronUp } from "lucide-react";
import { formatMoney } from "../lib/store";

export default function MortgageCalculator({ propertyPrice = 15000000, propertyTitle = "" }) {
  const [price, setPrice] = useState(propertyPrice || 15000000);
  const [downPaymentPercent, setDownPaymentPercent] = useState(20);
  const [interestRate, setInterestRate] = useState(8.5);
  const [tenureYears, setTenureYears] = useState(20);
  const [showAmortization, setShowAmortization] = useState(false);

  // Sync if initial propertyPrice changes
  React.useEffect(() => {
    if (propertyPrice) setPrice(propertyPrice);
  }, [propertyPrice]);

  const downPaymentAmount = useMemo(() => {
    return Math.round((price * downPaymentPercent) / 100);
  }, [price, downPaymentPercent]);

  const loanPrincipal = useMemo(() => {
    return Math.max(0, price - downPaymentAmount);
  }, [price, downPaymentAmount]);

  const { monthlyEmi, totalInterest, totalPayment, principalRatio, interestRatio } = useMemo(() => {
    if (loanPrincipal <= 0 || interestRate <= 0 || tenureYears <= 0) {
      return { monthlyEmi: 0, totalInterest: 0, totalPayment: 0, principalRatio: 100, interestRatio: 0 };
    }

    const monthlyRate = interestRate / 12 / 100;
    const totalMonths = tenureYears * 12;

    const factor = Math.pow(1 + monthlyRate, totalMonths);
    const emi = Math.round((loanPrincipal * monthlyRate * factor) / (factor - 1));

    const totalPay = emi * totalMonths;
    const totalInt = Math.max(0, totalPay - loanPrincipal);

    const princRatio = Math.round((loanPrincipal / totalPay) * 100);
    const intRatio = 100 - princRatio;

    return {
      monthlyEmi: emi,
      totalInterest: totalInt,
      totalPayment: totalPay,
      principalRatio: princRatio,
      interestRatio: intRatio,
    };
  }, [loanPrincipal, interestRate, tenureYears]);

  const milestones = useMemo(() => {
    if (loanPrincipal <= 0 || interestRate <= 0 || tenureYears <= 0 || monthlyEmi <= 0) return [];
    const monthlyRate = interestRate / 12 / 100;
    const totalMonths = tenureYears * 12;
    const yearList = [1, 3, 5, 10, 15, 20, 25, 30].filter((y) => y < tenureYears);
    yearList.push(tenureYears);

    return yearList.map((yr) => {
      const m = Math.min(yr * 12, totalMonths);
      if (m === totalMonths) {
        return {
          year: yr,
          balance: 0,
          principalPaid: loanPrincipal,
          interestPaid: totalInterest,
        };
      }
      const pow = Math.pow(1 + monthlyRate, m);
      const balance = Math.max(0, Math.round(loanPrincipal * pow - (monthlyEmi * (pow - 1)) / monthlyRate));
      const principalPaid = Math.min(loanPrincipal, Math.max(0, loanPrincipal - balance));
      const interestPaid = Math.max(0, m * monthlyEmi - principalPaid);
      return {
        year: yr,
        balance,
        principalPaid,
        interestPaid,
      };
    });
  }, [loanPrincipal, interestRate, tenureYears, monthlyEmi, totalInterest]);

  return (
    <div className="calculator-card">
      <div className="calc-header">
        <div className="calc-title-box">
          <Calculator size={18} aria-hidden="true" />
          <h3>Mortgage &amp; EMI Estimator</h3>
        </div>
        <span className="calc-badge">Live Calculator</span>
      </div>
      <p className="calc-subtitle">
        Estimate your monthly installments for {propertyTitle || "this home"}.
      </p>

      <div className="calc-grid">
        {/* Sliders & Inputs */}
        <div className="calc-controls">
          <div className="calc-field">
            <div className="calc-label-row">
              <label htmlFor="home-price">Home Price</label>
              <span className="calc-val">{formatMoney(price)}</span>
            </div>
            <input
              id="home-price"
              type="range"
              min={1000000}
              max={100000000}
              step={500000}
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              className="calc-range"
            />
            <div className="calc-range-marks">
              <span>₹10 L</span>
              <span>₹5 Cr</span>
              <span>₹10 Cr</span>
            </div>
          </div>

          <div className="calc-field">
            <div className="calc-label-row">
              <label htmlFor="down-payment">
                Down Payment ({downPaymentPercent}%)
              </label>
              <span className="calc-val">{formatMoney(downPaymentAmount)}</span>
            </div>
            <input
              id="down-payment"
              type="range"
              min={10}
              max={50}
              step={5}
              value={downPaymentPercent}
              onChange={(e) => setDownPaymentPercent(Number(e.target.value))}
              className="calc-range"
            />
            <div className="calc-preset-chips" aria-label="Quick down payment options">
              {[10, 20, 25, 30, 40].map((pct) => (
                <button
                  type="button"
                  key={pct}
                  className={`calc-chip ${downPaymentPercent === pct ? "active" : ""}`}
                  onClick={() => setDownPaymentPercent(pct)}
                  aria-label={`${pct}% down payment`}
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>

          <div className="calc-row-2col">
            <div className="calc-field">
              <div className="calc-label-row">
                <label htmlFor="interest-rate">Interest Rate</label>
                <span className="calc-val">{interestRate}%</span>
              </div>
              <input
                id="interest-rate"
                type="range"
                min={6.5}
                max={14}
                step={0.1}
                value={interestRate}
                onChange={(e) => setInterestRate(Number(e.target.value))}
                className="calc-range"
              />
            </div>

            <div className="calc-field">
              <div className="calc-label-row">
                <label htmlFor="tenure-years">Loan Tenure</label>
                <span className="calc-val">{tenureYears} yrs</span>
              </div>
              <input
                id="tenure-years"
                type="range"
                min={5}
                max={30}
                step={1}
                value={tenureYears}
                onChange={(e) => setTenureYears(Number(e.target.value))}
                className="calc-range"
              />
              <div className="calc-preset-chips" aria-label="Quick tenure options">
                {[10, 15, 20, 25, 30].map((yr) => (
                  <button
                    type="button"
                    key={yr}
                    className={`calc-chip ${tenureYears === yr ? "active" : ""}`}
                    onClick={() => setTenureYears(yr)}
                    aria-label={`${yr} years tenure`}
                  >
                    {yr}y
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Results Panel */}
        <div className="calc-results">
          <div className="calc-emi-box">
            <span className="emi-label">Estimated Monthly EMI</span>
            <div className="emi-amount">
              ₹{monthlyEmi.toLocaleString("en-IN")}
              <small>/month</small>
            </div>
          </div>

          {/* Visual ratio bar */}
          <div className="calc-bar-wrap">
            <div className="calc-bar">
              <div
                className="calc-bar-princ"
                style={{ width: `${principalRatio}%` }}
                title={`Principal: ${principalRatio}%`}
              />
              <div
                className="calc-bar-int"
                style={{ width: `${interestRatio}%` }}
                title={`Interest: ${interestRatio}%`}
              />
            </div>
            <div className="calc-bar-legend">
              <span className="legend-princ">
                <span className="dot dot-princ" /> Principal ({principalRatio}%)
              </span>
              <span className="legend-int">
                <span className="dot dot-int" /> Interest ({interestRatio}%)
              </span>
            </div>
          </div>

          <div className="calc-breakdown-list">
            <div className="breakdown-item">
              <span>Principal Loan Amount</span>
              <b>{formatMoney(loanPrincipal)}</b>
            </div>
            <div className="breakdown-item">
              <span>Total Interest Payable</span>
              <b>{formatMoney(totalInterest)}</b>
            </div>
            <div className="breakdown-item total">
              <span>Total Amount Payable</span>
              <b>{formatMoney(totalPayment)}</b>
            </div>
          </div>
        </div>
      </div>

      {/* Expandable Amortization Projection Table */}
      {milestones.length > 0 && (
        <div className="calc-amortization-section">
          <button
            type="button"
            className="calc-amortization-toggle"
            onClick={() => setShowAmortization(!showAmortization)}
            aria-expanded={showAmortization}
            aria-label="Toggle amortization payoff projection"
          >
            <span>{showAmortization ? "Hide" : "View"} Loan Payoff Milestones &amp; Amortization</span>
            {showAmortization ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {showAmortization && (
            <div className="calc-amortization-table-wrap">
              <table className="calc-amortization-table">
                <thead>
                  <tr>
                    <th>Milestone</th>
                    <th>Principal Paid</th>
                    <th>Interest Paid</th>
                    <th>Outstanding Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {milestones.map((m) => (
                    <tr key={m.year}>
                      <td><b>Year {m.year}</b></td>
                      <td>{formatMoney(m.principalPaid)}</td>
                      <td>{formatMoney(m.interestPaid)}</td>
                      <td><b>{formatMoney(m.balance)}</b></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <div className="calc-footer">
        <p className="calc-disclaimer">
          <Info size={13} aria-hidden="true" />
          <span>Rates are indicative. Haven advisors can connect you with trusted banking partners for pre-approved loans.</span>
        </p>
      </div>
    </div>
  );
}

