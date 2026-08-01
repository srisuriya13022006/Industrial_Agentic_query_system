from backend.agents.extraction_agent import ExtractionAgent

agent = ExtractionAgent()

sample_text = """
Pump P101 failed due to bearing overheating.
Technician Raj replaced the bearing.
Lubrication completed.
"""

results = agent.extract(sample_text)

for item in results:

    print("\n========================")

    print("\nCHUNK")
    print(item["chunk"])

    print("\nENTITIES")
    print(item["entities"])

    print("\nRELATIONSHIPS")
    print(item["relationships"])