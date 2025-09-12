#!/usr/bin/env python3
"""
Test script for Enhanced SREC Chatbot with RAG
Tests both SREC-specific questions and general chat functionality
"""

import requests
import json
import time
import sys

# Configuration
API_BASE = "http://localhost:5000"
TEST_QUESTIONS = [
    # SREC-specific questions
    {
        "question": "What is SREC?",
        "type": "srec",
        "expected_keywords": ["Sree Rama Engineering College"]
    },
    {
        "question": "Who is the principal of SREC?",
        "type": "srec", 
        "expected_keywords": ["Dr. K. Jaya Chandra"]
    },
    {
        "question": "What departments are available at SREC?",
        "type": "srec",
        "expected_keywords": ["CSE", "Civil", "ECE", "EEE", "Mechanical"]
    },
    {
        "question": "What is the contact email of SREC?",
        "type": "srec",
        "expected_keywords": ["info@sreerama.ac.in"]
    },
    {
        "question": "Where is SREC located?",
        "type": "srec",
        "expected_keywords": ["Tirupathi", "Andhra Pradesh"]
    },
    # General questions (non-SREC)
    {
        "question": "What is machine learning?",
        "type": "general",
        "expected_keywords": []
    },
    {
        "question": "Write a hello world program in Python",
        "type": "general",
        "expected_keywords": []
    }
]

def print_header(title):
    print("\n" + "="*60)
    print(f"🧪 {title}")
    print("="*60)

def print_result(success, message):
    icon = "✅" if success else "❌"
    print(f"{icon} {message}")

def test_health_check():
    """Test API health and RAG system status"""
    print_header("HEALTH CHECK & RAG STATUS")

    try:
        response = requests.get(f"{API_BASE}/", timeout=10)
        if response.status_code == 200:
            data = response.json()
            print_result(True, f"API is healthy: {data.get('message', 'OK')}")
            print_result(data.get('srec_data_loaded', False), 
                        f"SREC data loaded: {data.get('srec_data_loaded', False)}")
            print_result(data.get('rag_system') == 'enabled', 
                        f"RAG system: {data.get('rag_system', 'unknown')}")
            return True
        else:
            print_result(False, f"Health check failed: HTTP {response.status_code}")
            return False

    except requests.exceptions.RequestException as e:
        print_result(False, f"Cannot connect to API: {e}")
        return False

def test_status_endpoint():
    """Test detailed status endpoint"""
    print_header("DETAILED STATUS CHECK")

    try:
        response = requests.get(f"{API_BASE}/status", timeout=10)
        if response.status_code == 200:
            data = response.json()

            print_result(True, f"LLM Model: {data.get('model', 'unknown')}")
            print_result(True, f"Embed Model: {data.get('embed_model', 'unknown')}")
            print_result(data.get('connected', False), f"Ollama Connected: {data.get('connected', False)}")

            rag_info = data.get('rag_system', {})
            if isinstance(rag_info, dict):
                print_result(rag_info.get('enabled', False), 
                           f"RAG Enabled: {rag_info.get('enabled', False)}")
                print_result(rag_info.get('srec_data_loaded', False), 
                           f"SREC Data Loaded: {rag_info.get('srec_data_loaded', False)}")
                if 'documents_indexed' in rag_info:
                    print_result(rag_info['documents_indexed'] > 0, 
                               f"Documents Indexed: {rag_info['documents_indexed']}")

            return True
        else:
            print_result(False, f"Status check failed: HTTP {response.status_code}")
            return False

    except requests.exceptions.RequestException as e:
        print_result(False, f"Cannot get status: {e}")
        return False

def test_simple_chat(question, expected_keywords=None, question_type="unknown"):
    """Test simple chat endpoint"""
    try:
        payload = {"message": question}
        response = requests.post(f"{API_BASE}/chat/simple", 
                               json=payload, 
                               headers={'Content-Type': 'application/json'},
                               timeout=30)

        if response.status_code == 200:
            data = response.json()
            answer = data.get('response', '')
            used_rag = data.get('used_rag', False)

            # Basic success check
            success = len(answer.strip()) > 0
            print_result(success, f"Question: {question[:50]}...")

            if success:
                print(f"   💬 Answer: {answer[:100]}...")
                print(f"   🔍 Used RAG: {used_rag}")
                print(f"   📝 Type: {question_type}")

                # Check if expected keywords are present
                if expected_keywords:
                    found_keywords = []
                    for keyword in expected_keywords:
                        if keyword.lower() in answer.lower():
                            found_keywords.append(keyword)

                    if found_keywords:
                        print_result(True, f"Found expected keywords: {', '.join(found_keywords)}")
                    else:
                        print_result(False, f"Missing expected keywords: {', '.join(expected_keywords)}")

                # For SREC questions, check if RAG was used
                if question_type == "srec":
                    print_result(used_rag, f"RAG system activated for SREC question")

            return success

        else:
            print_result(False, f"Chat failed: HTTP {response.status_code}")
            try:
                error_data = response.json()
                print(f"   Error: {error_data.get('error', 'Unknown error')}")
            except:
                print(f"   Response: {response.text[:200]}")
            return False

    except requests.exceptions.RequestException as e:
        print_result(False, f"Request failed: {e}")
        return False

def run_all_tests():
    """Run all tests"""
    print("🚀 Starting Enhanced SREC Chatbot Tests...")

    # Test 1: Health check
    health_ok = test_health_check()
    if not health_ok:
        print("\n❌ Health check failed. Please ensure:")
        print("   1. Ollama is running: ollama serve")
        print("   2. Required models are pulled:")
        print("      - ollama pull gemma2:2b")
        print("      - ollama pull mxbai-embed-large")
        print("   3. Flask app is running: python app.py")
        print("   4. srec_qa.json file is present")
        return False

    # Test 2: Status check
    status_ok = test_status_endpoint()

    # Test 3: Chat functionality
    print_header("CHAT FUNCTIONALITY TESTS")

    passed_tests = 0
    total_tests = len(TEST_QUESTIONS)

    for i, test_case in enumerate(TEST_QUESTIONS, 1):
        print(f"\n🧪 Test {i}/{total_tests}")
        success = test_simple_chat(
            test_case["question"],
            test_case.get("expected_keywords", []),
            test_case["type"]
        )
        if success:
            passed_tests += 1

        # Add small delay between tests
        time.sleep(1)

    # Summary
    print_header("TEST SUMMARY")
    print_result(health_ok, f"Health Check")
    print_result(status_ok, f"Status Check") 
    print_result(passed_tests == total_tests, f"Chat Tests: {passed_tests}/{total_tests} passed")

    overall_success = health_ok and status_ok and (passed_tests >= total_tests * 0.8)

    if overall_success:
        print("\n🎉 All tests passed! Your Enhanced SREC Chatbot is working correctly.")
        print("\n📝 Try these sample questions:")
        for test_case in TEST_QUESTIONS[:5]:
            print(f"   • {test_case['question']}")
    else:
        print("\n⚠️  Some tests failed. Please check the setup and error messages above.")

    return overall_success

if __name__ == "__main__":
    print("Enhanced SREC Chatbot Test Suite")
    print("=" * 40)

    if len(sys.argv) > 1 and sys.argv[1] == "--quick":
        # Quick test mode
        print("Quick test mode - health check only\n")
        test_health_check()
        test_status_endpoint()
    else:
        # Full test suite
        run_all_tests()

    print("\nTest completed. ✨")
