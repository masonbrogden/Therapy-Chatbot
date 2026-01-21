from langchain_community.document_loaders import PyPDFLoader, DirectoryLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from typing import List
from langchain.schema import Document
import os
import ssl


def load_pdf_file(data):
    loader = DirectoryLoader(
        data,
        glob="**/*.pdf",
        loader_cls=PyPDFLoader
    )

    documents = loader.load()
    return documents

def filter_to_minimal_docs(docs: List[Document]) -> List[Document]:
    """

    Filters a list of Document objects to only include page_content, removing metadata.
    """
    minimal_docs: List[Document] = []
    for doc in docs:
        src = doc.metadata.get("source")
        minimal_docs.append(
             Document(
                page_content=doc.page_content,
                metadata={"source": src}     
            )
        )
    return minimal_docs

def text_split(extracted_data):
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=20,
    )
    texts_chunks = text_splitter.split_documents(extracted_data)
    return texts_chunks

def download_hugging_face_embeddings():
    from langchain_huggingface import HuggingFaceEmbeddings

    # Temporarily disable SSL verification for HuggingFace downloads
    # This is a workaround for certificate issues in corporate environments
    os.environ['CURL_CA_BUNDLE'] = ''
    os.environ['REQUESTS_CA_BUNDLE'] = ''

    # Create unverified SSL context
    ssl._create_default_https_context = ssl._create_unverified_context

    model_name="sentence-transformers/all-MiniLM-L6-v2"
    embeddings = HuggingFaceEmbeddings(
        model_name='sentence-transformers/all-MiniLM-L6-v2',
        model_kwargs={'trust_remote_code': True}
    )
    return embeddings
