import nltk
from rouge_score import rouge_scorer
from typing import Dict, List, Union, Tuple
import numpy as np

# Download required NLTK data
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')

class EvaluationMetrics:
    def __init__(self):
        """Initialize evaluation metrics with ROUGE and BLEU scorers."""
        self.rouge_scorer = rouge_scorer.RougeScorer(['rouge1', 'rouge2', 'rougeL'], use_stemmer=True)
        
    def calculate_rouge_scores(self, reference: str, hypothesis: str) -> Dict[str, Dict[str, float]]:
        """
        Calculate ROUGE scores between reference and hypothesis texts.
        
        Args:
            reference (str): Reference text
            hypothesis (str): Generated text to evaluate
            
        Returns:
            Dict containing ROUGE-1, ROUGE-2, and ROUGE-L scores
        """
        scores = self.rouge_scorer.score(reference, hypothesis)
        return {
            'rouge1': {'precision': scores['rouge1'].precision, 
                      'recall': scores['rouge1'].recall, 
                      'fmeasure': scores['rouge1'].fmeasure},
            'rouge2': {'precision': scores['rouge2'].precision, 
                      'recall': scores['rouge2'].recall, 
                      'fmeasure': scores['rouge2'].fmeasure},
            'rougeL': {'precision': scores['rougeL'].precision, 
                      'recall': scores['rougeL'].recall, 
                      'fmeasure': scores['rougeL'].fmeasure}
        }
    
    def calculate_bleu_score(self, reference: str, hypothesis: str, 
                           max_n: int = 4, weights: List[float] = None) -> float:
        """
        Calculate BLEU score between reference and hypothesis texts.
        
        Args:
            reference (str): Reference text
            hypothesis (str): Generated text to evaluate
            max_n (int): Maximum n-gram order to consider
            weights (List[float]): Weights for different n-gram orders
            
        Returns:
            float: BLEU score
        """
        if weights is None:
            weights = [1.0/max_n] * max_n
            
        reference_tokens = nltk.word_tokenize(reference.lower())
        hypothesis_tokens = nltk.word_tokenize(hypothesis.lower())
        
        # Calculate n-gram precision for each order
        precisions = []
        for n in range(1, max_n + 1):
            reference_ngrams = list(nltk.ngrams(reference_tokens, n))
            hypothesis_ngrams = list(nltk.ngrams(hypothesis_tokens, n))
            
            if not hypothesis_ngrams:
                return 0.0
                
            # Calculate clipped precision
            clipped_matches = 0
            for h_ngram in hypothesis_ngrams:
                if h_ngram in reference_ngrams:
                    clipped_matches += 1
                    reference_ngrams.remove(h_ngram)
                    
            precision = clipped_matches / len(hypothesis_ngrams)
            precisions.append(precision)
            
        # Calculate brevity penalty
        bp = 1.0
        if len(hypothesis_tokens) < len(reference_tokens):
            bp = np.exp(1 - len(reference_tokens) / len(hypothesis_tokens))
            
        # Calculate final BLEU score
        bleu_score = bp * np.exp(sum(w * np.log(p) for w, p in zip(weights, precisions)))
        return bleu_score
    
    def evaluate_response(self, reference: str, hypothesis: str) -> Dict[str, Union[float, Dict]]:
        """
        Evaluate a response using both ROUGE and BLEU scores.
        
        Args:
            reference (str): Reference text
            hypothesis (str): Generated text to evaluate
            
        Returns:
            Dict containing both ROUGE and BLEU scores
        """
        rouge_scores = self.calculate_rouge_scores(reference, hypothesis)
        bleu_score = self.calculate_bleu_score(reference, hypothesis)
        
        return {
            'rouge_scores': rouge_scores,
            'bleu_score': bleu_score
        } 