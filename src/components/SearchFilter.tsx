import { Search, X } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

interface SearchFilterProps {
    value: string;
    onChange: (value: string) => void;
    onClear: () => void;
}

export default function SearchFilter({ value, onChange, onClear }: SearchFilterProps) {
    return (
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <Input
                type="text"
                placeholder="Search tables or columns..."
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="pl-9 pr-9 bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus:border-indigo-500"
            />
            {value && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClear}
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 hover:bg-zinc-800"
                >
                    <X className="w-3 h-3" />
                </Button>
            )}
        </div>
    );
}
