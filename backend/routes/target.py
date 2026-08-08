from flask import Blueprint, request, jsonify
from models import db, DrugTarget

target_bp = Blueprint("target", __name__)


@target_bp.route("/", methods=["GET"])
def list_targets():
    targets = DrugTarget.query.order_by(DrugTarget.created_at.desc()).all()
    return jsonify([t.to_dict() for t in targets])


@target_bp.route("/", methods=["POST"])
def add_target():
    data = request.get_json()
    if not data or "name" not in data:
        return jsonify({"error": "'name' is required"}), 400

    target = DrugTarget(
        name=data["name"],
        protein_family=data.get("protein_family", ""),
        organism=data.get("organism", "Human"),
        binding_site=data.get("binding_site", ""),
        affinity_score=data.get("affinity_score", 0.0),
        status=data.get("status", "Active"),
    )
    db.session.add(target)
    db.session.commit()
    return jsonify(target.to_dict()), 201


@target_bp.route("/<int:target_id>", methods=["GET"])
def get_target(target_id):
    target = DrugTarget.query.get_or_404(target_id)
    result = target.to_dict()
    result["molecules"] = [m.to_dict() for m in target.molecules]
    return jsonify(result)


@target_bp.route("/<int:target_id>", methods=["PUT"])
def update_target(target_id):
    target = DrugTarget.query.get_or_404(target_id)
    data = request.get_json()
    for field in ["name", "protein_family", "organism", "binding_site", "affinity_score", "status"]:
        if field in data:
            setattr(target, field, data[field])
    db.session.commit()
    return jsonify(target.to_dict())


@target_bp.route("/<int:target_id>", methods=["DELETE"])
def delete_target(target_id):
    target = DrugTarget.query.get_or_404(target_id)
    db.session.delete(target)
    db.session.commit()
    return jsonify({"message": "Deleted"}), 200
