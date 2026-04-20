import uvicorn
import os
from dotenv import load_dotenv

# Load environment variables from the root .env.local
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env.local"))

if __name__ == "__main__":
    print("🚀 Starting Agency OS Intelligence Backend...")
    print("📍 URL: http://localhost:8000")
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
