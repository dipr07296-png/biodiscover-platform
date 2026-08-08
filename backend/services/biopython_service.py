"""
Biopython Service — performs real bioinformatics analysis on sequences.
"""
import json
from Bio.Seq import Seq
from Bio.SeqUtils import gc_fraction
from Bio.SeqUtils.ProtParam import ProteinAnalysis
from Bio.Align import PairwiseAligner
from collections import Counter


def detect_sequence_type(sequence: str) -> str:
    """Detect if sequence is DNA, RNA, or Protein."""
    seq = sequence.upper().replace(" ", "").replace("\n", "")
    dna_chars = set("ATCGN")
    rna_chars = set("AUCGN")
    if set(seq).issubset(dna_chars):
        return "DNA"
    elif set(seq).issubset(rna_chars):
        return "RNA"
    else:
        return "Protein"


def analyze_dna_sequence(sequence: str) -> dict:
    """Full analysis of a DNA sequence using Biopython."""
    seq = sequence.upper().replace(" ", "").replace("\n", "")
    bio_seq = Seq(seq)

    # GC content
    gc = round(gc_fraction(bio_seq) * 100, 2)

    # Complement & reverse complement
    complement = str(bio_seq.complement())
    rev_complement = str(bio_seq.reverse_complement())

    # Transcription (DNA → RNA)
    mrna = str(bio_seq.transcribe())

    # Translation (DNA → Protein) — trim to codon boundary
    trimmed = bio_seq[: len(bio_seq) - (len(bio_seq) % 3)]
    protein = str(trimmed.translate(to_stop=True)) if len(trimmed) >= 3 else ""

    # ORF detection (simple) — find all start codons
    orfs = []
    for i in range(len(seq) - 2):
        codon = seq[i : i + 3]
        if codon == "ATG":
            end = i + 3
            while end + 2 < len(seq):
                stop_c = seq[end : end + 3]
                if stop_c in ["TAA", "TAG", "TGA"]:
                    orfs.append(
                        {
                            "start": i + 1,
                            "end": end + 3,
                            "length": end + 3 - i,
                            "sequence": seq[i : end + 3],
                        }
                    )
                    break
                end += 3
        if len(orfs) >= 5:
            break

    # Codon usage
    codon_usage = {}
    for i in range(0, len(seq) - 2, 3):
        codon = seq[i : i + 3]
        if len(codon) == 3:
            codon_usage[codon] = codon_usage.get(codon, 0) + 1

    # Nucleotide composition
    composition = {
        "A": seq.count("A"),
        "T": seq.count("T"),
        "G": seq.count("G"),
        "C": seq.count("C"),
        "N": seq.count("N"),
    }

    # AT/GC ratio
    at = composition["A"] + composition["T"]
    gc_count = composition["G"] + composition["C"]
    at_gc_ratio = round(at / gc_count, 3) if gc_count > 0 else 0

    # Melting temperature (Wallace rule for < 14 bp else Marmur/Doty)
    length = len(seq)
    if length < 14:
        tm = round((composition["A"] + composition["T"]) * 2 + (composition["G"] + composition["C"]) * 4, 1)
    else:
        tm = round(64.9 + 41 * (gc_count - 16.4) / length, 1)

    return {
        "sequence_type": "DNA",
        "length": length,
        "gc_content": gc,
        "at_gc_ratio": at_gc_ratio,
        "melting_temperature": tm,
        "complement": complement[:80] + ("..." if len(complement) > 80 else ""),
        "reverse_complement": rev_complement[:80] + ("..." if len(rev_complement) > 80 else ""),
        "mrna": mrna[:80] + ("..." if len(mrna) > 80 else ""),
        "protein_translation": protein[:60] + ("..." if len(protein) > 60 else ""),
        "composition": composition,
        "orfs_found": len(orfs),
        "orfs": orfs[:5],
        "codon_usage": dict(sorted(codon_usage.items(), key=lambda x: -x[1])[:15]),
    }


def analyze_protein_sequence(sequence: str) -> dict:
    """Analyze a protein sequence using Biopython ProteinAnalysis."""
    seq = sequence.upper().replace(" ", "").replace("\n", "")
    # Remove stop codons if present
    seq = seq.replace("*", "")

    try:
        analysis = ProteinAnalysis(seq)

        mw = round(analysis.molecular_weight(), 2)
        pi = round(analysis.isoelectric_point(), 2)
        instability = round(analysis.instability_index(), 2)
        gravy = round(analysis.gravy(), 4)
        aromaticity = round(analysis.aromaticity(), 4)
        ss_fractions = analysis.secondary_structure_fraction()

        # Amino acid composition
        aa_comp = analysis.get_amino_acids_percent()
        aa_comp = {k: round(v * 100, 2) for k, v in aa_comp.items()}

        # Charge at pH 7
        charge = round(analysis.charge_at_pH(7.0), 3)

        return {
            "sequence_type": "Protein",
            "length": len(seq),
            "molecular_weight": mw,
            "isoelectric_point": pi,
            "instability_index": instability,
            "stability": "Stable" if instability < 40 else "Unstable",
            "gravy": gravy,
            "aromaticity": aromaticity,
            "charge_at_ph7": charge,
            "secondary_structure": {
                "helix": round(ss_fractions[0] * 100, 2),
                "turn": round(ss_fractions[1] * 100, 2),
                "sheet": round(ss_fractions[2] * 100, 2),
            },
            "amino_acid_composition": aa_comp,
        }
    except Exception as e:
        return {"error": str(e), "sequence_type": "Protein", "length": len(seq)}


def pairwise_align(seq1: str, seq2: str) -> dict:
    """Pairwise global alignment using Biopython PairwiseAligner."""
    s1 = seq1.upper().replace(" ", "").replace("\n", "")
    s2 = seq2.upper().replace(" ", "").replace("\n", "")

    aligner = PairwiseAligner()
    aligner.mode = "global"
    aligner.match_score = 2
    aligner.mismatch_score = -1
    aligner.open_gap_score = -0.5
    aligner.extend_gap_score = -0.1

    alignments = list(aligner.align(s1, s2))

    if not alignments:
        return {"error": "No alignment found"}

    best = alignments[0]
    score = round(best.score, 2)

    aligned_s1 = best.aligned[0]
    aligned_s2 = best.aligned[1]

    # Reconstruct aligned strings
    def reconstruct(seq, blocks, total_len):
        result = []
        pos = 0
        for start, end in blocks:
            result.append("-" * (start - pos))
            result.append(seq[start:end])
            pos = end
        result.append("-" * (total_len - pos))
        return "".join(result)

    aln_str1 = reconstruct(s1, aligned_s1, len(s1))
    aln_str2 = reconstruct(s2, aligned_s2, len(s2))

    matches = sum(a == b for a, b in zip(aln_str1, aln_str2) if a != "-" and b != "-")
    align_len = max(len(aln_str1), len(aln_str2))
    identity = round((matches / align_len) * 100, 2) if align_len > 0 else 0

    # Format output
    formatted = f"Seq1: {aln_str1[:80]}\n      {''.join('|' if a==b else ' ' for a,b in zip(aln_str1[:80], aln_str2[:80]))}\nSeq2: {aln_str2[:80]}"

    return {
        "score": score,
        "identity_percent": identity,
        "alignment_length": align_len,
        "matches": matches,
        "aligned_seq1": aln_str1[:100],
        "aligned_seq2": aln_str2[:100],
        "formatted": formatted,
    }


def analyze_sequence(sequence: str, name: str = "Unnamed") -> dict:
    """Main entry point — auto-detects type and runs analysis."""
    seq_type = detect_sequence_type(sequence)
    if seq_type in ("DNA", "RNA"):
        result = analyze_dna_sequence(sequence)
    else:
        result = analyze_protein_sequence(sequence)
    result["name"] = name
    return result
