import { NextResponse } from "next/server";
import FirecrawlApp from "@mendable/firecrawl-js";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Type definitions
interface ScrapeResult {
    service_name: string;
    reward: string;
    conditions: string[];
    denial_conditions: string[];
}

interface AffiliateResult {
    title: string;
    link: string;
    snippet: string;
}

export async function POST(req: Request) {
    try {
        const { url } = await req.json();

        if (!url) {
            return NextResponse.json({ error: "URL is required" }, { status: 400 });
        }

        // --- MOCK MODE CHECK ---
        // If no API keys are present, return a beautiful mock response
        if (!process.env.FIRECRAWL_API_KEY || !process.env.GEMINI_API_KEY) {
            console.log("Missing API keys, returning mock data");
            await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate delay
            return NextResponse.json({
                service_name: "Mock Service (Gemini Example)",
                reward: "1,000 Points (1,000 JPY)",
                conditions: [
                    "New registration",
                    "Complete profile within 7 days",
                    "Exchange at least 300 points"
                ],
                denial_conditions: [
                    "Duplicate registration",
                    "False information",
                    "Past registration history"
                ],
                affiliate_info: [
                    {
                        title: "A8.net: Mock Service Affiliate Program",
                        link: "https://www.a8.net/",
                        snippet: "High reward campaign for new users. Join the Mock Service affiliate program on A8.net."
                    },
                    {
                        title: "ValueCommerce: Mock Service Promotion",
                        link: "https://www.valuecommerce.ne.jp/",
                        snippet: "Promote Mock Service and earn rewards. Special terms apply for top affiliates."
                    }
                ]
            });
        }

        // --- REAL IMPLEMENTATION ---

        // 1. Scrape with Firecrawl
        console.log("Starting scrape for:", url);
        const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });
        let scrapeResponse;
        try {
            scrapeResponse = await firecrawl.scrape(url, {
                formats: ["markdown"],
            });
        } catch (e: any) {
            console.error("Firecrawl Error:", e);
            throw new Error(`Firecrawl failed: ${e.message}`);
        }

        if (!scrapeResponse.markdown) {
            console.error("Scrape response missing markdown:", scrapeResponse);
            throw new Error("Failed to scrape content from URL (No markdown returned)");
        }

        const markdown = scrapeResponse.markdown;
        console.log("Scrape successful, length:", markdown.length);

        // 2. Analyze with Google Gemini
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({
            model: "gemini-flash-latest",
            generationConfig: { responseMimeType: "application/json" }
        });

        const prompt = `
    You are an expert at extracting structured data from point site descriptions.
    Analyze the following markdown content and extract the data into a JSON object.
    
    Required JSON structure:
    {
      "service_name": "The name of the service or product being promoted",
      "reward": "The point reward or percentage",
      "conditions": ["List of strings describing requirements"],
      "denial_conditions": ["List of strings describing what invalidates the reward"]
    }

    Markdown Content:
    ${markdown}
    `;

        const result = await model.generateContent(prompt);
        let text = result.response.text();

        // Clean up potential markdown formatting if Gemini adds it
        text = text.replace(/```json\n|\n```/g, "").replace(/```/g, "").trim();

        if (!text) throw new Error("Failed to analyze content with Gemini");

        const analysis: ScrapeResult = JSON.parse(text);

        // 3. Search Affiliate ASPs (Serper or Google Search)
        const affiliateInfo: AffiliateResult[] = [];

        if (process.env.SERPER_API_KEY) {
            const query = `${analysis.service_name} アフィリエイト ASP`;
            const serperResponse = await fetch("https://google.serper.dev/search", {
                method: "POST",
                headers: {
                    "X-API-KEY": process.env.SERPER_API_KEY,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ q: query, gl: "jp", hl: "ja" })
            });

            if (serperResponse.ok) {
                const serperData = await serperResponse.json();
                // Filter organics for ASP-like domains or titles
                const organic = serperData.organic || [];
                // Simple heuristic mapping
                organic.forEach((item: any) => {
                    affiliateInfo.push({
                        title: item.title,
                        link: item.link,
                        snippet: item.snippet
                    });
                });
            }
        }

        return NextResponse.json({
            ...analysis,
            affiliate_info: affiliateInfo.slice(0, 5) // Return top 5
        });

    } catch (error: any) {
        console.error("API Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
