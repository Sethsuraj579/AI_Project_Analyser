"""
Improved Chatbot Module with RAG (Retrieval Augmented Generation)
Uses vector embeddings + LLM for accurate, context-aware project recommendations.
"""

import logging
from langchain_core.prompts import PromptTemplate
from langchain_huggingface import HuggingFacePipeline
from transformers import pipeline as hf_pipeline

from .ml_models import model_manager

logger = logging.getLogger(__name__)


class ImprovedProjectChatbot:
    """
    Chatbot for project-related suggestions with RAG.
    Retrieves relevant analysis context before generating responses.
    """
    
    def __init__(self):
        self.embeddings = model_manager.load_embeddings()
        self.chroma_client = model_manager.get_chroma_client()
        self.chain = None
        self.llm = None
    
    def _initialize_llm(self):
        """Initialize the LLM (using better model than distilgpt2)"""
        if self.llm is None:
            try:
                # Using a better instruction-following model
                text_gen = hf_pipeline(
                    "text-generation",
                    model="gpt2-medium",  # Better than distilgpt2
                    device=-1,  # CPU; use 0 for GPU
                    max_new_tokens=120,
                    do_sample=True,
                    temperature=0.7,
                    top_p=0.95,
                    repetition_penalty=1.5,
                    no_repeat_ngram_size=3,
                )
                self.llm = HuggingFacePipeline(pipeline=text_gen)
                logger.info("LLM initialized with gpt2-medium")
            except Exception as e:
                logger.warning(f"Could not load gpt2-medium, falling back to distilgpt2: {e}")
                try:
                    text_gen = hf_pipeline(
                        "text-generation",
                        model="distilgpt2",
                        device=-1,
                        max_new_tokens=100,
                        do_sample=True,
                        temperature=0.7,
                    )
                    self.llm = HuggingFacePipeline(pipeline=text_gen)
                except Exception as e2:
                    logger.error(f"Error initializing LLM: {e2}")
                    raise
    
    def build_project_context(self, project_id):
        """
        Build comprehensive context from project data and latest analysis.
        This ensures the chatbot has accurate information to base responses on.
        """
        try:
            from .models import Project, AnalysisRun, MetricSnapshot
            
            project = Project.objects.get(id=project_id)
            latest_run = project.analysis_runs.filter(
                status='completed'
            ).order_by('-completed_at').first()
            
            context_parts = [
                f"📌 Project: {project.name}",
            ]
            
            if project.description:
                context_parts.append(f"Description: {project.description[:200]}")
            
            if latest_run:
                context_parts.append(f"\n📊 Latest Analysis:")
                context_parts.append(f"Overall Score: {latest_run.overall_score:.1f}/100 ({latest_run.overall_grade})")
                
                # Add dimension scores
                metrics = latest_run.metrics.all().order_by('dimension')
                if metrics:
                    context_parts.append("\nDimension Scores:")
                    for metric in metrics:
                        status_emoji = "✅" if metric.normalised_score >= 80 else "⚠️" if metric.normalised_score >= 50 else "❌"
                        context_parts.append(
                            f"  {status_emoji} {metric.get_dimension_display()}: {metric.normalised_score:.0f}/100 ({metric.grade})"
                        )
                
                # Add improvement suggestions
                weak_dimensions = metrics.filter(normalised_score__lt=60).order_by('normalised_score')
                if weak_dimensions:
                    context_parts.append("\n⚠️ Areas for Improvement:")
                    for metric in weak_dimensions[:3]:
                        context_parts.append(f"  • {metric.get_dimension_display()}")
            
            return "\n".join(context_parts)
        
        except Exception as e:
            logger.error(f"Error building project context: {e}")
            return f"Project: {project_id}"
    
    def retrieve_similar_projects(self, query, limit=3):
        """
        Retrieve similar projects from vector DB for cross-project insights.
        """
        try:
            collection = self.chroma_client.get_or_create_collection(name="project_insights")
            query_embedding = self.embeddings.encode(query)
            
            results = collection.query(
                query_embeddings=[query_embedding.tolist()],
                n_results=limit,
                include=["documents", "metadatas"]
            )
            
            if results and results.get('documents'):
                return results['documents'][0]
            return []
        except Exception as e:
            logger.error(f"Error retrieving similar projects: {e}")
            return []
    
    def chat(self, user_message, project_id=None):
        """
        Generate intelligent chatbot response with RAG.
        
        Args:
            user_message: User's question
            project_id: UUID of the project being discussed
        
        Returns:
            String response from chatbot
        """
        try:
            self._initialize_llm()
            
            # Build system prompt
            system_prompt = """You are an expert software architect and code quality analyst. 
You help developers understand their project metrics and suggest improvements.
Keep responses concise (2-3 sentences), actionable, and based on the provided metrics.
If specific metrics are low, suggest concrete next steps."""
            
            # Get project context
            project_context = ""
            if project_id:
                project_context = self.build_project_context(project_id)
            
            # Create enhanced prompt
            prompt_template = PromptTemplate(
                input_variables=["system", "context", "question"],
                template="""{system}

PROJECT CONTEXT:
{context}

USER QUESTION: {question}

RESPONSE:"""
            )
            
            # Generate response
            final_prompt = prompt_template.format(
                system=system_prompt,
                context=project_context or "General project guidance",
                question=user_message
            )
            
            response = self.llm.invoke(final_prompt)
            response_text = response if isinstance(response, str) else str(response)
            
            # Extract just the response part (avoid prompt repetition)
            if "RESPONSE:" in response_text:
                response_text = response_text.split("RESPONSE:")[-1]
            
            response_text = response_text.strip().split("\n")[0]  # First line only
            
            # Ensure quality output
            if not response_text or len(response_text) < 10:
                return "I can help you improve your project metrics. Could you ask a more specific question?"
            
            return response_text
        
        except Exception as e:
            logger.error(f"Chatbot error: {e}")
            return "I'm experiencing technical difficulties. Please try again."


# Singleton instance
chatbot = ImprovedProjectChatbot()

