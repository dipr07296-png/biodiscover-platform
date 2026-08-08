from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class DrugTarget(db.Model):
    __tablename__ = "drug_targets"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    protein_family = db.Column(db.String(100))
    organism = db.Column(db.String(100))
    binding_site = db.Column(db.Text)
    affinity_score = db.Column(db.Float, default=0.0)
    status = db.Column(db.String(50), default="Active")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    molecules = db.relationship("Molecule", backref="target", lazy=True)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "protein_family": self.protein_family,
            "organism": self.organism,
            "binding_site": self.binding_site,
            "affinity_score": self.affinity_score,
            "status": self.status,
            "molecule_count": len(self.molecules),
            "created_at": self.created_at.isoformat(),
        }


class Molecule(db.Model):
    __tablename__ = "molecules"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    smiles = db.Column(db.Text)
    molecular_weight = db.Column(db.Float)
    log_p = db.Column(db.Float)
    hbd = db.Column(db.Integer)  # hydrogen bond donors
    hba = db.Column(db.Integer)  # hydrogen bond acceptors
    tpsa = db.Column(db.Float)   # topological polar surface area
    status = db.Column(db.String(50), default="Screening")
    lipinski_pass = db.Column(db.Boolean, default=False)
    target_id = db.Column(db.Integer, db.ForeignKey("drug_targets.id"), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "smiles": self.smiles,
            "molecular_weight": self.molecular_weight,
            "log_p": self.log_p,
            "hbd": self.hbd,
            "hba": self.hba,
            "tpsa": self.tpsa,
            "status": self.status,
            "lipinski_pass": self.lipinski_pass,
            "target_id": self.target_id,
            "target_name": self.target.name if self.target else None,
            "created_at": self.created_at.isoformat(),
        }


class SequenceRecord(db.Model):
    __tablename__ = "sequence_records"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    sequence = db.Column(db.Text, nullable=False)
    sequence_type = db.Column(db.String(20))  # DNA, RNA, Protein
    gc_content = db.Column(db.Float)
    length = db.Column(db.Integer)
    molecular_weight = db.Column(db.Float)
    analysis_json = db.Column(db.Text)  # JSON string with full analysis
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        import json
        return {
            "id": self.id,
            "name": self.name,
            "sequence_type": self.sequence_type,
            "gc_content": self.gc_content,
            "length": self.length,
            "molecular_weight": self.molecular_weight,
            "analysis": json.loads(self.analysis_json) if self.analysis_json else {},
            "created_at": self.created_at.isoformat(),
        }
