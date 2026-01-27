import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { CATEGORIES, QUESTIONS, type Category } from "@/utils/weather-chat-flow";
import type { ChatMessage } from "@/types/chat";
import { api } from "@shared/routes";
import { apiRequest } from "@/lib/queryClient";
import { AiFillRobot } from "react-icons/ai";
import { useViewport } from "@/hooks/use-viewport";
import StringToHtml from "./StringToHtml";

type Props = {
    weather: {
        location: string;
        timestamp: string;
    };
    open: boolean;
    onClose: () => void;
};


export function WeatherChat({ open, onClose, weather }: Props) {
    const [topMessages, setTopMessages] = useState<ChatMessage[]>([]);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [maxUp, setMaxUp] = useState<number>(-300);
    const [input, setInput] = useState("");
    const [currentQuestion, setCurrentQuestion] = useState<string | null>(null);
    const maxDown = 20;

    const [activeCategory, setActiveCategory] = useState<Category | null>(null);
    const [loading, setLoading] = useState(false);
    const [yOffset, setYOffset] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const startYRef = useRef(0);
    const startOffsetRef = useRef(0);
    const chatRef = useRef<HTMLDivElement | null>(null);

    const scrollToTop = () => {
        chatRef.current?.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };


    const { vh, vw } = useViewport();
    useEffect(() => {
        // recalc bounds on viewport change
        const calcBounds = () => {
            if (vw >= 768) {
                setMaxUp(-1 * (vh - 750));
            } else {
                setMaxUp(0);
                setYOffset(0); // reset position on mobile
            }
        };
        calcBounds();
    }, [vh, vw]);


    const handleCategoryClick = (category: Category) => {
        setActiveCategory(category);
        scrollToTop();
    };

    const askQuestion = async (question: string) => {
        setCurrentQuestion(question);
        scrollToTop();
        setActiveCategory(null);
        setLoading(true);

        try {
            const res = await apiRequest("POST", api.ai.weatherAdvice.path, {
                question,
                weather,
            });

            const data = await res.json();

            const newPair: ChatMessage[] = [
                { role: "user", content: question },
                { role: "assistant", content: data.answer },
            ];

            // 🔝 Insert at TOP
            setTopMessages((prev) => [...newPair, ...prev]);
            scrollToTop();
        } catch (err) {
            setTopMessages((prev) => [
                {
                    role: "assistant",
                    content: "Sorry, I couldn’t generate advice right now.",
                },
                ...prev,
            ]);
        } finally {
            setLoading(false);
        }
    };


    const onPointerDown = (e: React.PointerEvent) => {
        // only allow dragging on md+ screens
        if (window.innerWidth < 768) return;

        setIsDragging(true);
        startYRef.current = e.clientY;
        startOffsetRef.current = yOffset;
    };

    const onPointerMove = (e: PointerEvent) => {
        if (!isDragging) return;

        const deltaY = e.clientY - startYRef.current;
        const nextOffset = startOffsetRef.current + deltaY;
        setYOffset(Math.min(maxDown, Math.max(maxUp, nextOffset)));
    };

    const stopDragging = () => {
        setIsDragging(false);
    };

    useEffect(() => {
        if (!isDragging) return;

        window.addEventListener("pointermove", onPointerMove);
        window.addEventListener("pointerup", stopDragging);

        return () => {
            window.removeEventListener("pointermove", onPointerMove);
            window.removeEventListener("pointerup", stopDragging);
        };
    }, [isDragging]);



    if (!open) return null;

    return (
        <div
            className="
      fixed inset-0 md:inset-auto
      md:bottom-24 md:right-6
      z-50
      flex md:block
      bg-background/80 md:bg-transparent
      backdrop-blur-sm md:backdrop-blur-0
    "
    
    style={{
        transform:
        window.innerWidth >= 768
            ? `translateY(${yOffset}px)`
            : undefined,
        bottom: window.innerWidth >= 768 ? "6rem" : undefined,
        
    }}
        >
            <div
                className="
                w-full h-full md:w-[480px] md:h-[620px]
                bg-background
                rounded-none md:rounded-3xl
                shadow-2xl
                flex flex-col
                border
                overflow-hidden
  "
            >
                {/* Header */}
                <div onPointerDown={onPointerDown} style = {{userSelect: isDragging ? "none" : "auto", cursor: isDragging ? "grabbing" : "grab"}} className="flex items-center justify-between px-4 py-3 border-b">
                    <div className="flex items-center gap-3">
                        <div className="bg-primary/10 text-primary p-2 rounded-xl">
                            <AiFillRobot className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="font-semibold leading-tight">
                                Weather Assistant
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {weather.location}
                            </p>
                        </div>
                    </div>

                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={onClose}
                    >
                        ✕
                    </Button>
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col px-4 h-[75%] md:h-auto">
                    {/* DOUBLE GAP below header 👇 */}
                    <div className="mt-6 mb-6 flex flex-wrap gap-2">
                        {CATEGORIES.map((cat) => (
                            <Button
                                key={cat}
                                size="sm"
                                variant={activeCategory === cat ? "default" : "outline"}
                                onClick={() => handleCategoryClick(cat)}
                                disabled={loading}
                            >
                                {cat}
                            </Button>
                        ))}
                    </div>

                    {/* Chat */}
                    <div ref = {chatRef} className="flex-1 max-h-[80%] md:mb-0 md:max-h-[372px] min-h-0 overflow-y-auto space-y-4 pb-4 pr-1">
                        {/* Question options */}
                    {activeCategory && !loading && (
                        <div className="border-t pt-3 pb-4">
                            <div className="flex flex-wrap gap-2 max-w-full">
                                {QUESTIONS[activeCategory].map((q) => (
                                <Button
                                    key={q}
                                    size="sm"
                                    variant="outline"
                                    className="max-w-full truncate text-left text-wrap"
                                    onClick={() => askQuestion(q)}
                                >
                                    {q}
                                </Button>
                                ))}
                            </div>
                            </div>

                        )}

                         {loading && <>
                            <div
                                className={`max-w-[100%] md:max-w-[85%] rounded-2xl px-4 py-2 text-sm ml-auto bg-primary/90 text-primary-foreground`}
                            >
                                {currentQuestion}
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Thinking…
                            </div>
                        </>}

                    {/* 🔝 Priority / pinned messages */}
                    {topMessages.map((msg, i) => {
                        const classNameOnRoot = `max-w-[100%] md:max-w-[85%] px-4 pb-2 text-sm mr-auto`;
                        return (
                        msg.role === "user"? <div
                        key={`top-${i}`}
                        className={`max-w-[100%] md:max-w-[85%] rounded-2xl px-4 py-2 text-sm ml-auto bg-primary/90 text-primary-foreground`}
                        >
                        {msg.content}
                        </div>:
                        <StringToHtml key = {`top-${i}`} classNameOnRoot = {classNameOnRoot} htmlString={msg.content} />
                    )})}


                    {/* Divider */}
                    {topMessages.length > 0 && messages.length > 0 && (
                        <div className="text-xs text-muted-foreground text-center py-2">
                        Previous conversation
                        </div>
                    )}

                    {/* Normal chat */}
                    {messages.map((msg, i) => (
                        <div
                        key={`msg-${i}`}
                        className={`max-w-[100%] md:max-w-[85%] rounded-2xl px-4 py-2 text-sm
                            ${
                            msg.role === "user"
                                ? "ml-auto bg-primary text-primary-foreground"
                                : "mr-auto bg-muted"
                            }`}
                        >
                        {msg.content}
                        </div>
                    ))}
                    </div>
                </div>

                {/* Bottom Input Bar */}
                <div className="border-t bg-background px-3 py-3">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            if (!input.trim() || loading) return;
                            askQuestion(input.trim());
                            setInput("");
                        }}
                        className="flex items-end gap-2"
                    >
                        <div className="flex flex-1 gap-2">
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask any weather related question…"
                                rows={1}
                                disabled={loading}
                                className="
                        w-[100%] flex-2 resize-none rounded-xl border
                        bg-muted/40 px-3 py-2 text-sm
                        focus:outline-none focus:ring-2 focus:ring-primary
                        disabled:opacity-60
                        "
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        if (!input.trim() || loading) return;
                                        askQuestion(input.trim());
                                        setInput("");
                                    }
                                }}
                            />
                            <Button
                                type="submit"
                                size="icon"
                                disabled={loading || !input.trim()}
                                className="h-9 w-9 rounded-xl"
                            >
                                {loading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <span className="text-sm font-medium">→</span>
                                )}
                            </Button>
                        </div>
                    </form>
                </div>

            </div>
        </div>
    );

}
