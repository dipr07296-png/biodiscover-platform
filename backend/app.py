from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from config import Config
from models import db
import os

def create_app():
    _base = os.path.dirname(os.path.abspath(__file__))
    _frontend = os.path.join(_base, "..", "frontend")
    app = Flask(__name__, static_folder=_frontend, static_url_path="")
    app.config.from_object(Config)

    # Initialize extensions
    db.init_app(app)
    CORS(app, origins="*")

    # Register blueprints
    from routes.dashboard import dashboard_bp
    from routes.sequence import sequence_bp
    from routes.molecule import molecule_bp
    from routes.target import target_bp

    app.register_blueprint(dashboard_bp, url_prefix="/api/dashboard")
    app.register_blueprint(sequence_bp, url_prefix="/api/sequences")
    app.register_blueprint(molecule_bp, url_prefix="/api/molecules")
    app.register_blueprint(target_bp, url_prefix="/api/targets")

    # Serve frontend
    @app.route("/")
    def index():
        return send_from_directory(app.static_folder, "index.html")

    @app.route("/<path:path>")
    def static_proxy(path):
        full = os.path.join(app.static_folder, path)
        if os.path.isfile(full):
            return send_from_directory(app.static_folder, path)
        return send_from_directory(app.static_folder, "index.html")

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Not found"}), 404

    @app.errorhandler(500)
    def server_error(e):
        return jsonify({"error": "Internal server error"}), 500

    # Create tables and seed data
    with app.app_context():
        db.create_all()
        _seed_data()

    return app


def _seed_data():
    """Seed sample data if DB is empty."""
    from models import DrugTarget, Molecule, SequenceRecord
    import json

    if DrugTarget.query.count() > 0:
        return  # already seeded

    targets = [
        DrugTarget(name="EGFR Kinase", protein_family="Tyrosine Kinase", organism="Human",
                   binding_site="ATP-binding pocket", affinity_score=8.7, status="Active"),
        DrugTarget(name="BCR-ABL1", protein_family="Tyrosine Kinase", organism="Human",
                   binding_site="SH2 domain", affinity_score=9.1, status="Active"),
        DrugTarget(name="SARS-CoV-2 Mpro", protein_family="Cysteine Protease", organism="Virus",
                   binding_site="Substrate cleft", affinity_score=7.9, status="Active"),
        DrugTarget(name="HIV-1 Protease", protein_family="Aspartic Protease", organism="Virus",
                   binding_site="Active site dimer", affinity_score=8.3, status="Active"),
        DrugTarget(name="COX-2", protein_family="Cyclooxygenase", organism="Human",
                   binding_site="Arachidonic acid site", affinity_score=7.2, status="Active"),
        DrugTarget(name="BRAF V600E", protein_family="Serine/Threonine Kinase", organism="Human",
                   binding_site="DFG-out pocket", affinity_score=8.9, status="Active"),
        DrugTarget(name="ACE2 Receptor", protein_family="Metalloprotease", organism="Human",
                   binding_site="Zinc binding site", affinity_score=6.8, status="Research"),
    ]
    db.session.add_all(targets)
    db.session.flush()

    molecules = [
        Molecule(name="Imatinib", smiles="Cc1ccc(cc1Nc2nccc(n2)c3cccnc3)NC(=O)c4ccc(cc4)CN5CCN(CC5)C",
                 molecular_weight=493.6, log_p=3.74, hbd=3, hba=9, tpsa=86.3,
                 status="Approved", lipinski_pass=True, target_id=targets[1].id),
        Molecule(name="Gefitinib", smiles="COc1cc2ncnc(Nc3ccc(F)c(Cl)c3)c2cc1OCCCN4CCOCC4",
                 molecular_weight=446.9, log_p=3.2, hbd=1, hba=7, tpsa=68.7,
                 status="Approved", lipinski_pass=True, target_id=targets[0].id),
        Molecule(name="Nirmatrelvir", smiles="CC1(C2CC1NC(=O)C(F)(F)F)C(=O)NC(CC3CCNC3=O)C(=O)N4CC(F)(F)C4C#N",
                 molecular_weight=499.5, log_p=1.9, hbd=4, hba=9, tpsa=134.3,
                 status="Approved", lipinski_pass=True, target_id=targets[2].id),
        Molecule(name="Vemurafenib", smiles="CCCS(=O)(=O)Nc1ccc(F)c(c1)C(=O)c2ccc(cc2)c3cnc(Cl)nc3",
                 molecular_weight=489.9, log_p=3.9, hbd=1, hba=5, tpsa=82.5,
                 status="Approved", lipinski_pass=True, target_id=targets[5].id),
        Molecule(name="Celecoxib", smiles="Cc1ccc(-c2cc(C(F)(F)F)nn2-c2ccc(N)cc2)cc1",
                 molecular_weight=381.4, log_p=3.5, hbd=1, hba=4, tpsa=77.8,
                 status="Approved", lipinski_pass=True, target_id=targets[4].id),
        Molecule(name="Compound-BB1", smiles="C1CC(N2CCOCC2)CN1c3nc4ccccc4n3CC(F)(F)F",
                 molecular_weight=358.4, log_p=2.1, hbd=0, hba=7, tpsa=49.2,
                 status="Clinical Trial", lipinski_pass=True, target_id=targets[0].id),
        Molecule(name="Compound-BB2", smiles="O=C(Nc1cccc(c1)C#N)c2ccc(cc2)N3CCN(CC3)C(=O)c4ccccc4",
                 molecular_weight=428.5, log_p=3.8, hbd=1, hba=6, tpsa=70.1,
                 status="Lead", lipinski_pass=True, target_id=targets[3].id),
        Molecule(name="Compound-BB3", smiles="CC(=O)Nc1ccc(cc1)OCC(=O)Nc2ccc(F)cc2",
                 molecular_weight=330.3, log_p=1.9, hbd=2, hba=5, tpsa=78.4,
                 status="Hit", lipinski_pass=True, target_id=targets[6].id),
        Molecule(name="Compound-BB4", smiles="Fc1ccc(cc1)c2nc3cc(OCCO)ccc3o2",
                 molecular_weight=299.3, log_p=3.1, hbd=1, hba=4, tpsa=55.8,
                 status="Screening", lipinski_pass=True, target_id=targets[4].id),
        Molecule(name="Compound-BB5 (Failed)", smiles="c1ccc2c(c1)C(=O)c3cccc4cccc2c34",
                 molecular_weight=228.3, log_p=5.3, hbd=0, hba=2, tpsa=34.1,
                 status="Preclinical", lipinski_pass=False, target_id=targets[1].id),
    ]
    db.session.add_all(molecules)

    sample_dna = "ATGGCTTCTTGGCAGATCTTGAGAGCCCAAGCAGCAGCAGCAGCAGCGGCAGGAGGATCATCATCATCATCGCCATGGAGCTGGAGAACATGAAGATCAGCATCAACATCAAGCAGTTCTACAACATTCAGAAGCCCCACAACCTGGACCTCAAGGAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGTAA"
    seq_record = SequenceRecord(
        name="Sample EGFR Exon Fragment",
        sequence=sample_dna,
        sequence_type="DNA",
        gc_content=52.3,
        length=len(sample_dna),
        analysis_json=json.dumps({"seeded": True}),
    )
    db.session.add(seq_record)
    db.session.commit()


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, port=5000)
