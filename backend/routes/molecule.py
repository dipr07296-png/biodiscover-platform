from flask import Blueprint, request, jsonify
from models import db, Molecule
from services.drug_service import evaluate_lipinski, calculate_drug_score

molecule_bp = Blueprint("molecule", __name__)


@molecule_bp.route("/", methods=["GET"])
def list_molecules():
    status = request.args.get("status")
    target_id = request.args.get("target_id", type=int)
    lipinski = request.args.get("lipinski_pass")

    query = Molecule.query
    if status:
        query = query.filter_by(status=status)
    if target_id:
        query = query.filter_by(target_id=target_id)
    if lipinski is not None:
        query = query.filter_by(lipinski_pass=(lipinski.lower() == "true"))

    molecules = query.order_by(Molecule.created_at.desc()).all()
    return jsonify([m.to_dict() for m in molecules])


@molecule_bp.route("/", methods=["POST"])
def add_molecule():
    data = request.get_json()
    required = ["name"]
    for f in required:
        if f not in data:
            return jsonify({"error": f"'{f}' is required"}), 400

    mw = data.get("molecular_weight", 0.0)
    log_p = data.get("log_p", 0.0)
    hbd = data.get("hbd", 0)
    hba = data.get("hba", 0)
    tpsa = data.get("tpsa", 0.0)

    lipinski = evaluate_lipinski(mw, log_p, hbd, hba)
    drug_score = calculate_drug_score(mw, log_p, hbd, hba, tpsa)

    mol = Molecule(
        name=data["name"],
        smiles=data.get("smiles", ""),
        molecular_weight=mw,
        log_p=log_p,
        hbd=hbd,
        hba=hba,
        tpsa=tpsa,
        status=data.get("status", "Screening"),
        lipinski_pass=lipinski["passes"],
        target_id=data.get("target_id"),
    )
    db.session.add(mol)
    db.session.commit()

    result = mol.to_dict()
    result["lipinski"] = lipinski
    result["drug_score"] = drug_score
    return jsonify(result), 201


@molecule_bp.route("/<int:mol_id>", methods=["GET"])
def get_molecule(mol_id):
    mol = Molecule.query.get_or_404(mol_id)
    result = mol.to_dict()
    if mol.molecular_weight:
        result["lipinski"] = evaluate_lipinski(
            mol.molecular_weight, mol.log_p or 0, mol.hbd or 0, mol.hba or 0
        )
        result["drug_score"] = calculate_drug_score(
            mol.molecular_weight, mol.log_p or 0, mol.hbd or 0, mol.hba or 0, mol.tpsa or 0
        )
    return jsonify(result)


@molecule_bp.route("/<int:mol_id>", methods=["PUT"])
def update_molecule(mol_id):
    mol = Molecule.query.get_or_404(mol_id)
    data = request.get_json()
    for field in ["name", "smiles", "molecular_weight", "log_p", "hbd", "hba", "tpsa", "status", "target_id"]:
        if field in data:
            setattr(mol, field, data[field])
    # Re-evaluate Lipinski
    mol.lipinski_pass = evaluate_lipinski(
        mol.molecular_weight or 0, mol.log_p or 0, mol.hbd or 0, mol.hba or 0
    )["passes"]
    db.session.commit()
    return jsonify(mol.to_dict())


@molecule_bp.route("/<int:mol_id>", methods=["DELETE"])
def delete_molecule(mol_id):
    mol = Molecule.query.get_or_404(mol_id)
    db.session.delete(mol)
    db.session.commit()
    return jsonify({"message": "Deleted"}), 200
