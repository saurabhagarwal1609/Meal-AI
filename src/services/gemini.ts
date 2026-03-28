import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export interface MealAnalysis {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  description: string;
}

export async function analyzeMealImage(base64Image: string): Promise<MealAnalysis | null> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            { text: "Analyze this meal and provide nutritional information. Return a JSON object with name, calories, protein, carbs, fat, and a brief description." },
            { inlineData: { mimeType: "image/jpeg", data: base64Image } }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            calories: { type: Type.NUMBER },
            protein: { type: Type.NUMBER },
            carbs: { type: Type.NUMBER },
            fat: { type: Type.NUMBER },
            description: { type: Type.STRING }
          },
          required: ["name", "calories", "protein", "carbs", "fat", "description"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Error analyzing meal image:", error);
    return null;
  }
}

export async function generateMealPlan(userProfile: any): Promise<string> {
  try {
    const prompt = `Generate a personalized 1-day meal plan and exercise routine for a user with the following profile:
    - Weight: ${userProfile.weight}kg
    - Height: ${userProfile.height}cm
    - Age: ${userProfile.age}
    - Goal: ${userProfile.goal}
    - Activity Level: ${userProfile.activityLevel}
    - Daily Calorie Target: ${userProfile.dailyCalorieTarget}kcal
    
    Please provide:
    1. A detailed meal plan (Breakfast, Lunch, Dinner, and 2 Snacks) with estimated calories and macros.
    2. A recommended workout routine for the day (including warm-up, main exercises, and cool-down).
    3. 3 specific tips to help them reach their goal.
    
    Format the response using clean Markdown with clear headings and bullet points.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: "You are a professional nutritionist and fitness coach. Provide clear, healthy, and practical meal and exercise suggestions."
      }
    });

    return response.text;
  } catch (error) {
    console.error("Error generating meal plan:", error);
    return "Failed to generate meal plan. Please try again later.";
  }
}
