"""
Machine Learning Models Manager
Handles transformer models, summarization, and embeddings
"""

from transformers import pipeline
from sentence_transformers import SentenceTransformer
import chromadb
import logging

logger = logging.getLogger(__name__)

class ModelManager:
    """Singleton for managing ML models"""
    _instance = None
    _models = {}

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ModelManager, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self._initialized = True
        self.summarizer = None
        self.embeddings = None
        self.chroma_client = None

    def load_summarizer(self):
        """Load text generation model for summaries (distilgpt2 for speed)"""
        if self.summarizer is None:
            try:
                logger.info("Loading summarizer model...")
                self.summarizer = pipeline(
                    "text-generation",
                    model="distilgpt2",
                    device=-1  # Use CPU; change to 0 for GPU
                )
                logger.info("Summarizer loaded successfully")
            except Exception as e:
                logger.error(f"Error loading summarizer: {e}")
                raise
        return self.summarizer

    def load_embeddings(self):
        """Load embeddings model for semantic search"""
        if self.embeddings is None:
            try:
                logger.info("Loading embeddings model...")
                self.embeddings = SentenceTransformer("all-MiniLM-L6-v2")
                logger.info("Embeddings model loaded")
            except Exception as e:
                logger.error(f"Error loading embeddings: {e}")
                raise
        return self.embeddings

    def get_chroma_client(self):
        """Initialize Chroma vector database"""
        if self.chroma_client is None:
            try:
                logger.info("Initializing Chroma client...")
                self.chroma_client = chromadb.Client()
                logger.info("Chroma client initialized")
            except Exception as e:
                logger.error(f"Error initializing Chroma: {e}")
                raise
        return self.chroma_client

    def summarize(self, text, max_length=100, min_length=30):
        """Extract summary from text (extractive summarization)"""
        if not text:
            return ""
        
        try:
            # Clean and split into sentences
            import re
            sentences = re.split(r'(?<=[.!?])\s+', text.strip())
            sentences = [s.strip() for s in sentences if s.strip()]
            
            if not sentences:
                return text[:max_length].strip()
            
            # Build summary by taking full sentences until we hit max_length
            summary = ""
            for sentence in sentences:
                if len(summary) + len(sentence) + 1 <= max_length:
                    summary += " " + sentence if summary else sentence
                else:
                    break
            
            # If summary is empty or too short, just take first max_length chars
            if not summary or len(summary) < min_length:
                summary = text[:max_length].strip()
            
            return summary.strip()
            
        except Exception as e:
            logger.error(f"Error during summarization: {e}")
            return text[:max_length].strip()

    def get_embeddings(self, text):
        """Get embeddings for text"""
        try:
            embeddings = self.load_embeddings()
            return embeddings.encode(text)
        except Exception as e:
            logger.error(f"Error generating embeddings: {e}")
            return None


# Singleton instance
model_manager = ModelManager()
