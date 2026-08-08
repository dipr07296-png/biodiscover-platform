import json
from flask import Blueprint, request, jsonify
from models import db, SequenceRecord
from services.biopython_service import analyze_sequence, pairwise_align

sequence_bp = Blueprint("sequence", __name__)


@sequence_bp.route("/", methods=["GET"])
def list_sequences():
    records = SequenceRecord.query.order_by(SequenceRecord.created_at.desc()).all()
    return jsonify([r.to_dict() for r in records])


@sequence_bp.route("/analyze", methods=["POST"])
def analyze():
    data = request.get_json()
    if not data or "sequence" not in data:
        return jsonify({"error": "sequence field required"}), 400

    sequence = data["sequence"].strip()
    name = data.get("name", "Unnamed Sequence")

    if len(sequence) < 3:
        return jsonify({"error": "Sequence too short (minimum 3 characters)"}), 400

    result = analyze_sequence(sequence, name)

    # Persist to DB
    gc = result.get("gc_content")
    mw = result.get("molecular_weight")

    record = SequenceRecord(
        name=name,
        sequence=sequence,
        sequence_type=result.get("sequence_type", "Unknown"),
        gc_content=gc,
        length=result.get("length", len(sequence)),
        molecular_weight=mw,
        analysis_json=json.dumps(result),
    )
    db.session.add(record)
    db.session.commit()

    result["id"] = record.id
    return jsonify(result), 201


@sequence_bp.route("/align", methods=["POST"])
def align():
    data = request.get_json()
    if not data or "seq1" not in data or "seq2" not in data:
        return jsonify({"error": "seq1 and seq2 are required"}), 400

    result = pairwise_align(data["seq1"], data["seq2"])
    return jsonify(result)


@sequence_bp.route("/<int:seq_id>", methods=["GET"])
def get_sequence(seq_id):
    record = SequenceRecord.query.get_or_404(seq_id)
    return jsonify(record.to_dict())


@sequence_bp.route("/<int:seq_id>", methods=["DELETE"])
def delete_sequence(seq_id):
    record = SequenceRecord.query.get_or_404(seq_id)
    db.session.delete(record)
    db.session.commit()
    return jsonify({"message": "Deleted"}), 200
