from flask import Blueprint, jsonify
from models import db, Molecule, DrugTarget, SequenceRecord

dashboard_bp = Blueprint("dashboard", __name__)


@dashboard_bp.route("/stats", methods=["GET"])
def get_stats():
    total_molecules = Molecule.query.count()
    total_targets = DrugTarget.query.count()
    total_sequences = SequenceRecord.query.count()
    lipinski_pass = Molecule.query.filter_by(lipinski_pass=True).count()
    approved = Molecule.query.filter_by(status="Approved").count()
    screening = Molecule.query.filter_by(status="Screening").count()
    clinical = Molecule.query.filter_by(status="Clinical Trial").count()

    # Pipeline stages
    pipeline = {
        "Hit Identification": Molecule.query.filter_by(status="Hit").count(),
        "Lead Optimization": Molecule.query.filter_by(status="Lead").count(),
        "Preclinical": Molecule.query.filter_by(status="Preclinical").count(),
        "Clinical Trial": clinical,
        "Approved": approved,
    }

    # Target family distribution
    target_families = {}
    for t in DrugTarget.query.all():
        fam = t.protein_family or "Unknown"
        target_families[fam] = target_families.get(fam, 0) + 1

    # Molecule status distribution
    status_dist = {}
    for m in Molecule.query.all():
        s = m.status or "Unknown"
        status_dist[s] = status_dist.get(s, 0) + 1

    # Avg affinity score
    targets = DrugTarget.query.all()
    avg_affinity = round(
        sum(t.affinity_score for t in targets) / len(targets), 2
    ) if targets else 0

    return jsonify({
        "totals": {
            "molecules": total_molecules,
            "targets": total_targets,
            "sequences": total_sequences,
            "lipinski_pass": lipinski_pass,
            "approved": approved,
        },
        "pipeline": pipeline,
        "target_families": target_families,
        "status_distribution": status_dist,
        "avg_affinity_score": avg_affinity,
        "success_rate": round((approved / total_molecules * 100), 1) if total_molecules else 0,
    })
