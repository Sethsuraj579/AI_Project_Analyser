"""
Chatbot Module for Project Suggestions & Interactions
Uses LangChain with Chroma vector DB for context-aware responses.
"""

from langchain_huggingface import HuggingFacePipeline
from langchain_core.prompts import PromptTemplate
from transformers import pipeline as hf_pipeline
try:
    from langchain_chroma import Chroma
except ImportError:
    from langchain_community.vectorstores import Chroma
from .ml_models import model_manager
import logging

logger = logging.getLogger(__name__)

class ProjectChatbot:
    """Chatbot for project-related suggestions and Q&A"""
    
    def __init__(self):
        self.embeddings = model_manager.load_embeddings()
        self.chroma_client = model_manager.get_chroma_client()
        self.chain = None
    
    def _initialize_chain(self):
        """Initialize the LLM chain for chatbot"""
        if self.chain is None:
            try:
                # Load a lightweight text generation model
                text_gen = hf_pipeline(
                    "text-generation",
                    model="distilgpt2",
                    device=-1,  # CPU; use 0 for GPU
                    max_new_tokens=60,
                    do_sample=True,
                    temperature=0.5,
                    top_p=0.9,
                    repetition_penalty=1.2,
                    no_repeat_ngram_size=3,
                )
                llm = HuggingFacePipeline(pipeline=text_gen)
                
                prompt_template = PromptTemplate(
                    input_variables=["context", "question"],
                    template="""You are a helpful software assistant. Keep your answer brief and under 2 sentences.

Context: {context}
Question: {question}
Answer:"""
                )
                
                # Use LCEL to avoid deprecated LLMChain imports
                self.chain = prompt_template | llm
                logger.info("Chatbot chain initialized")
            except Exception as e:
                logger.error(f"Error initializing chatbot chain: {e}")
                raise
    
    def get_relevant_context(self, query, top_k=3):
        """Retrieve relevant projects from vector DB"""
        try:
            collection = self.chroma_client.get_or_create_collection(name="projects")
            query_embedding = self.embeddings.encode(query).tolist()
            
            results = collection.query(
                query_embeddings=[query_embedding],
                n_results=top_k
            )
            
            return results['documents'][0] if results['documents'] else []
        except Exception as e:
            logger.error(f"Error retrieving context: {e}")
            return []
    
    def chat(self, user_message, project_id=None):
        """Generate chatbot response to user questions with project context"""
        try:
            self._initialize_chain()
            
            # Get project context for more informed responses
            context_text = "You are a helpful assistant answering questions about software projects."
            
            if project_id:
                from .models import Project, AnalysisRun
                try:
                    project = Project.objects.get(id=project_id)
                    latest_run = project.analysis_runs.filter(status='completed').order_by('-completed_at').first()
                    
                    if latest_run:
                        # Build context from project and analysis data
                        metrics_summary = []
                        for metric in latest_run.metrics.all():
                            metrics_summary.append(
                                f"{metric.dimension}: {metric.normalised_score:.1f}/100 ({metric.grade})"
                            )
                        
                        context_text = f"""You are a helpful assistant answering questions about the project.

Project: {project.name}
Description: {project.description or 'N/A'}
Repository: {project.repo_url or 'Not provided'}

Latest Analysis Results:
Overall Score: {latest_run.overall_score:.1f}/100 (Grade: {latest_run.overall_grade})
Dimensions: {', '.join(metrics_summary)}"""
                
                except Exception as e:
                    logger.error(f"Error fetching project context: {e}")
            
            # Generate response
            if self.chain:
                response = self.chain.invoke({"context": context_text, "question": user_message})
                response_text = response if isinstance(response, str) else str(response)
                if "Answer:" in response_text:
                    response_text = response_text.split("Answer:")[-1]
                response_text = response_text.strip()
                
                # Clean up to 1-2 sentences max
                for sep in [". ", "! ", "? "]:
                    if sep in response_text:
                        parts = response_text.split(sep)
                        response_text = sep.join(parts[:2]).strip()
                        if not response_text.endswith((".", "!", "?")):
                            response_text += sep.strip()
                        break
                return response_text
            else:
                return "Unable to generate response at this time."
        
        except Exception as e:
            logger.error(f"Error in chatbot: {e}")
            return "Sorry, I encountered an error. Please try again."


# Singleton instance
chatbot = ProjectChatbot()

