"""
Drug service — Lipinski Rule of Five evaluation and scoring.
"""


def evaluate_lipinski(mw: float, log_p: float, hbd: int, hba: int) -> dict:
    """
    Apply Lipinski's Rule of Five to evaluate drug-likeness.

    Rules:
      MW <= 500 Da
      LogP <= 5
      HBD <= 5 (hydrogen bond donors)
      HBA <= 10 (hydrogen bond acceptors)
    """
    violations = []
    if mw > 500:
        violations.append(f"MW={mw:.1f} > 500 Da")
    if log_p > 5:
        violations.append(f"LogP={log_p:.2f} > 5")
    if hbd > 5:
        violations.append(f"HBD={hbd} > 5")
    if hba > 10:
        violations.append(f"HBA={hba} > 10")

    passes = len(violations) <= 1  # allow 1 violation (Lipinski's own rule)
    score = round((4 - len(violations)) / 4 * 100, 1)

    return {
        "passes": passes,
        "violations": violations,
        "violation_count": len(violations),
        "drug_likeness_score": score,
        "assessment": _assess_molecule(mw, log_p, hbd, hba, score),
    }


def _assess_molecule(mw, log_p, hbd, hba, score) -> str:
    if score >= 100:
        return "Excellent drug-like candidate"
    elif score >= 75:
        return "Good drug-like properties"
    elif score >= 50:
        return "Moderate drug-likeness — review violations"
    else:
        return "Poor drug-likeness — significant issues"


def calculate_drug_score(mw: float, log_p: float, hbd: int, hba: int, tpsa: float = 0.0) -> float:
    """
    Extended drug score combining Lipinski + TPSA (Veber's rule: TPSA <= 140 Å²).
    Returns a score from 0-100.
    """
    score = 100.0
    # Lipinski deductions
    if mw > 500:
        score -= min(30, (mw - 500) / 10)
    if log_p > 5:
        score -= min(20, (log_p - 5) * 5)
    if log_p < -2:
        score -= 10
    if hbd > 5:
        score -= (hbd - 5) * 5
    if hba > 10:
        score -= (hba - 10) * 3
    # TPSA deduction
    if tpsa > 140:
        score -= min(20, (tpsa - 140) / 5)
    return round(max(0.0, score), 1)
