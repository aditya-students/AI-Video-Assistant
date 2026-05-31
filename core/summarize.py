from langchain_mistralai import ChatMistralAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.runnables import RunnablePassthrough, RunnableLambda

import os
import time

def get_llm():
    return ChatMistralAI(model = "mistral-small-latest", mistral_api_key = os.getenv("MISTRAL_API_KEY"), temperature=0.3, max_retries=5)


def spilt_transcript(transcript:str) -> list:
    splitter = RecursiveCharacterTextSplitter(
        chunk_size = 3000,
        chunk_overlap  =300
    )
    
    return splitter.split_text(transcript)

def summarize(transcript : str) -> str:
    llm = get_llm()
    
    map_prompt = ChatPromptTemplate.from_messages(
        [
            ("system","Summarize this portion of a meeting transcript concisely."),
            ("human","{text}")
        ]
    )
    
    map_chain = map_prompt | llm | StrOutputParser()
    
    chunks = spilt_transcript(transcript)
    print(f"Summarizing {len(chunks)} chunk(s)...")
    
    chunk_summaries = []
    for i, chunk in enumerate(chunks):
        for attempt in range(5):
            try:
                result = map_chain.invoke({"text": chunk})
                chunk_summaries.append(result)
                print(f"  Chunk {i+1}/{len(chunks)} summarized.")
                if i < len(chunks) - 1:
                    time.sleep(1)  # small delay between calls to avoid rate limit
                break
            except Exception as e:
                if "429" in str(e) or "rate" in str(e).lower():
                    wait = 2 ** attempt * 2  # exponential backoff: 2, 4, 8, 16, 32s
                    print(f"  Rate limited on chunk {i+1}, retrying in {wait}s...")
                    time.sleep(wait)
                else:
                    raise
    
    combined = "\n\n".join(chunk_summaries)
    
    combined_prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                "You are an expert meeting summarizer. Combine these partial summaries"
                "into one final professional meeting summary in bullet points.",
            ),
            ("human","{text}"),
        ]
    )
    
    combined_chain = (
        RunnablePassthrough() | RunnableLambda(lambda x:{"text":x}) | combined_prompt | llm | StrOutputParser()
    )
    
    return combined_chain.invoke(combined)

def generate_title(transcript: str) -> str:
    llm = get_llm()
    
    
    
    title_chain = (
         RunnablePassthrough() | RunnableLambda(lambda x:{"text":x}) | ChatPromptTemplate.from_messages([
             (
                 "system",
                 "Based on the meeting transcript, generate a short professional meeting title"
                 "(max 8 words) . Only return thr title, nothing else"
             ),
             ("human","{text}")
         ])
         | llm
         |StrOutputParser()
    )
    return title_chain.invoke(transcript[:3000])