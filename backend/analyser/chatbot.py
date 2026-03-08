"""
Improved Chatbot Module with RAG (Retrieval Augmented Generation)
Uses vector embeddings + LLM for accurate, context-aware project recommendations.
"""

import logging
import re
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
                    max_new_tokens=140,
                    do_sample=False,
                    temperature=0.2,
                    top_p=0.9,
                    repetition_penalty=1.5,
                    no_repeat_ngram_size=3,
                    pad_token_id=50256,  # EOS token
                    eos_token_id=50256,
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
                        max_new_tokens=120,
                        do_sample=False,
                        temperature=0.2,
                        pad_token_id=50256,
                        eos_token_id=50256,
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
    
    def _get_smart_fallback(self, user_message, project_context):
        """
        Provide intelligent fallback responses based on keywords and context.
        """
        message_lower = user_message.lower()
        
        # Check for common question patterns
        if any(word in message_lower for word in ['improve', 'better', 'enhance', 'fix']):
            if 'security' in message_lower or 'sec' in project_context.lower():
                return "To improve security, focus on input validation, secure dependencies, and proper authentication. Review the Security dimension metrics for specific areas needing attention."
            elif 'performance' in message_lower or 'perf' in project_context.lower():
                return "For better performance, optimize database queries, implement caching, and minimize resource usage. Check the Performance metrics to identify bottlenecks."
            elif 'maintainability' in message_lower or 'maintain' in project_context.lower():
                return "Improve maintainability by following coding standards, writing clear documentation, and reducing code complexity. Review the Maintainability score for guidance."
            else:
                return "Based on your project metrics, focus on the dimensions with lower scores first. Start with quick wins that have high impact on overall quality."
        
        elif any(word in message_lower for word in ['score', 'rating', 'grade']):
            return "Your project scores are calculated across multiple dimensions including Security, Performance, Maintainability, and Documentation. Each dimension is weighted to compute your overall grade."
        
        elif any(word in message_lower for word in ['help', 'start', 'recommend']):
            return "I can help you understand your project metrics and suggest improvements. Ask me about specific dimensions like security, performance, or maintainability for targeted advice."
        
        elif any(word in message_lower for word in ['documentation', 'docs', 'readme']):
            return "Good documentation is crucial for maintainability. Ensure you have a clear README, API documentation, and inline code comments. Update them as your project evolves."
        
        else:
            return "I can help you improve your project quality. Ask about specific metrics, improvement strategies, or best practices for any dimension of your codebase."
    
    def _extract_complete_response(self, response_text):
        """
        Extract and clean the chatbot response, ensuring complete sentences.
        """
        # Remove the prompt if it's included in the response
        for marker in ["ASSISTANT RESPONSE", "RESPONSE:", "Assistant:", "AI:"]:
            if marker in response_text:
                response_text = response_text.split(marker)[-1]
        
        # Remove any repetition of the question
        if "USER QUESTION:" in response_text:
            response_text = response_text.split("USER QUESTION:")[0]
        
        # Clean up the text
        response_text = response_text.strip()

        # Remove common prefixes
        for prefix in ["(provide 2-3 complete sentences):", "Here's", "Here is"]:
            if response_text.startswith(prefix):
                response_text = response_text[len(prefix):].strip()
        
        # Split into sentences
        sentences = re.split(r'(?<=[.!?])\s+', response_text)
        
        # Keep complete sentences only (those ending with proper punctuation)
        complete_sentences = []
        for sentence in sentences:
            sentence = sentence.strip()
            if sentence and (sentence.endswith('.') or sentence.endswith('!') or sentence.endswith('?')):
                complete_sentences.append(sentence)
            elif sentence and len(complete_sentences) < 3:
                # If we don't have enough sentences yet, try to add ending punctuation
                if not sentence.endswith(('.', '!', '?', ',')):
                    # Check if sentence looks complete (has subject and verb)
                    if len(sentence.split()) > 5:
                        sentence += '.'
                        complete_sentences.append(sentence)
        
        # Join 2-3 complete sentences
        if complete_sentences:
            final_response = ' '.join(complete_sentences[:3])
            return final_response
        
        # Fallback: return first meaningful chunk
        lines = response_text.split('\n')
        for line in lines:
            line = line.strip()
            if len(line) > 20 and not line.startswith(('PROJECT', 'USER', 'RESPONSE:', 'CONTEXT:', 'ASSISTANT')):
                if not line.endswith(('.', '!', '?')):
                    line += '.'
                return line
        
        return response_text[:300].strip() + '.' if response_text else ""

    def _is_response_relevant(self, user_message, response_text):
        """
        Check whether the response is focused on the user's question.
        """
        stop_words = {
            "the", "and", "for", "with", "this", "that", "from", "your", "you",
            "what", "when", "where", "which", "about", "have", "has", "into", "only"
        }
        question_tokens = {
            token for token in re.findall(r"[a-zA-Z]{3,}", user_message.lower())
            if token not in stop_words
        }
        if not question_tokens:
            return True

        response_tokens = set(re.findall(r"[a-zA-Z]{3,}", response_text.lower()))
        overlap = len(question_tokens.intersection(response_tokens))
        return overlap >= 1

    def _finalize_professional_response(self, user_message, response_text, project_context):
        """
        Ensure concise, professional, and question-focused output.
        """
        if not response_text:
            return self._get_smart_fallback(user_message, project_context)

        response_text = response_text.strip()
        if not self._is_response_relevant(user_message, response_text):
            return self._get_smart_fallback(user_message, project_context)

        # Keep only 1-3 complete sentences to avoid rambling.
        sentences = [s.strip() for s in re.split(r'(?<=[.!?])\s+', response_text) if s.strip()]
        cleaned = []
        for sentence in sentences:
            if sentence.lower().startswith(("as an ai", "i am an ai", "i cannot provide")):
                continue
            cleaned.append(sentence)
            if len(cleaned) == 3:
                break

        final_text = " ".join(cleaned).strip() if cleaned else ""
        if not final_text:
            return self._get_smart_fallback(user_message, project_context)

        if not final_text.endswith((".", "!", "?")):
            final_text += "."

        return final_text

    def _is_summary_request(self, user_message):
        """Detect whether the user is asking for a project summary."""
        query = user_message.lower()
        summary_terms = [
            "summary", "summarize", "summarise", "overview", "report", "pointwise", "point-wise"
        ]
        return any(term in query for term in summary_terms)

    def _build_pointwise_summary(self, project_context):
        """Build a deterministic professional point-wise summary from project context."""
        if not project_context:
            return (
                "Project Summary\n"
                "- Analysis context is currently unavailable.\n"
                "- Run a project analysis to generate a complete quality summary.\n"
                "- Next step: open the project and trigger a new analysis run."
            )

        lines = [line.strip() for line in project_context.split("\n") if line.strip()]
        project_name = "Not available"
        overall_line = "Not available"
        dimension_lines = []
        risk_lines = []

        for line in lines:
            if line.startswith("📌 Project:"):
                project_name = line.replace("📌 Project:", "").strip()
            elif line.startswith("Overall Score:"):
                overall_line = line.replace("Overall Score:", "").strip()
            elif line.startswith(("✅", "⚠️", "❌")):
                dimension_lines.append(line.replace("✅", "").replace("⚠️", "").replace("❌", "").strip())
            elif line.startswith("•"):
                risk_lines.append(line.replace("•", "").strip())

        pointwise = [
            "Project Summary",
            f"- Project: {project_name}",
            f"- Overall Quality: {overall_line}",
        ]

        if dimension_lines:
            pointwise.append("- Dimension Highlights:")
            for item in dimension_lines[:4]:
                pointwise.append(f"  - {item}")

        if risk_lines:
            pointwise.append("- Priority Improvement Areas:")
            for item in risk_lines[:3]:
                pointwise.append(f"  - {item}")

        pointwise.append("- Recommended Action: Improve the lowest-scoring dimensions first, then run analysis again to confirm progress.")
        return "\n".join(pointwise)
    
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
Answer only the user question and stay strictly on-topic.
Use a professional tone and provide a direct answer in 1-3 complete sentences.
Do not include extra background unless the user asks for it.
If project data is missing, clearly say what is unavailable and give one practical next step."""
            
            # Get project context
            project_context = ""
            if project_id:
                project_context = self.build_project_context(project_id)

            # Return deterministic professional summary for summary-style requests.
            if self._is_summary_request(user_message):
                return self._build_pointwise_summary(project_context)
            
            # Create enhanced prompt
            prompt_template = PromptTemplate(
                input_variables=["system", "context", "question"],
                template="""{system}

PROJECT CONTEXT:
{context}

USER QUESTION: {question}

ASSISTANT RESPONSE (answer only the user question in 1-3 professional sentences):"""
            )
            
            # Generate response
            final_prompt = prompt_template.format(
                system=system_prompt,
                context=project_context or "General project guidance",
                question=user_message
            )
            
            response = self.llm.invoke(final_prompt)
            response_text = response if isinstance(response, str) else str(response)
            
            # Extract complete response with proper sentence handling
            response_text = self._extract_complete_response(response_text)
            response_text = self._finalize_professional_response(
                user_message=user_message,
                response_text=response_text,
                project_context=project_context,
            )
            
            # Ensure quality output
            if not response_text or len(response_text) < 10:
                # Use smart fallback instead of generic message
                return self._get_smart_fallback(user_message, project_context)
            
            return response_text
        
        except Exception as e:
            logger.error(f"Chatbot error: {e}")
            # Return smart fallback on error
            try:
                project_context = self.build_project_context(project_id) if project_id else ""
                return self._get_smart_fallback(user_message, project_context)
            except:
                return "I can help you improve your project quality. Ask about specific metrics, improvement strategies, or best practices for your codebase."


# Singleton instance
chatbot = ImprovedProjectChatbot()

