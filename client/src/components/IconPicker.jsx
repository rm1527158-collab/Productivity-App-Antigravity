import React from 'react';
import { 
  // Verified icons from @phosphor-icons/react index.d.ts
  Heartbeat, Heart, Brain, Moon, Sun, Book, Barbell, Drop, Fire, 
  Coffee, Leaf, MusicNote, Pencil, User, Bed, Alarm, CalendarCheck,
  CheckCircle, Smiley, Lightning, Anchor, Airplane,
  Basketball, Bicycle, BookOpen, Briefcase, Car, Cat, Dog, 
  Fish, Flower, ForkKnife, GameController, Gift, Globe, 
  GraduationCap, HandSoap, Headphones, House, Image, Key, 
  Lightbulb, Lock, MapPin, Martini, Medal, Microphone, Monitor,
  CurrencyDollar, PaintBrush, PawPrint, Phone, Pizza, Plant,
  PushPin, PuzzlePiece, Rocket, Scissors, ShoppingCart, 
  Shower, Sneaker, Snowflake, SoccerBall, 
  Star, Suitcase, Television, TennisBall, 
  Terminal, Ticket, Timer, Tooth, Train, Trophy, 
  Truck, Umbrella, VideoCamera, Wallet, 
  Watch, Wheelchair, WifiHigh, Wine, YinYang,
  Repeat, ArrowsClockwise, Hourglass, Calendar, Clock
} from '@phosphor-icons/react';
import clsx from 'clsx';

// Map of icon names to components
export const ICONS = {
  Heartbeat, Heart, Brain, Moon, Sun, Book, Barbell, Drop, Fire, 
  Coffee, Leaf, MusicNote, Pencil, User, Bed, Alarm, CalendarCheck,
  CheckCircle, Smiley, Lightning, Anchor, Airplane,
  Basketball, Bicycle, BookOpen, Briefcase, Car, Cat, Dog, 
  Fish, Flower, ForkKnife, GameController, Gift, Globe, 
  GraduationCap, HandSoap, Headphones, House, Image, Key, 
  Lightbulb, Lock, MapPin, Martini, Medal, Microphone, Monitor,
  CurrencyDollar, PaintBrush, PawPrint, Phone, Pizza, Plant,
  PushPin, PuzzlePiece, Rocket, Scissors, ShoppingCart, 
  Shower, Sneaker, Snowflake, SoccerBall, 
  Star, Suitcase, Television, TennisBall, 
  Terminal, Ticket, Timer, Tooth, Train, Trophy, 
  Truck, Umbrella, VideoCamera, Wallet, 
  Watch, Wheelchair, WifiHigh, Wine, YinYang,
  Repeat, ArrowsClockwise, Hourglass, Calendar, Clock
};

const IconPicker = ({ selected, onSelect }) => {
  return (
    <div className="relative">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/5 rounded-2xl -z-10" />
      
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3 p-4">
        {Object.entries(ICONS).map(([name, Icon]) => (
          <button
            key={name}
            type="button"
            onClick={() => onSelect(name)}
            className={clsx(
              "p-4 rounded-2xl flex items-center justify-center transition-all duration-300 aspect-square group/item relative overflow-hidden",
              selected === name 
                  ? "bg-gradient-to-br from-primary to-primary/90 text-primary-foreground shadow-2xl shadow-primary/30 ring-2 ring-primary ring-offset-4 ring-offset-background scale-105" 
                  : "bg-gradient-to-br from-muted/40 to-muted/20 text-muted-foreground hover:from-primary/20 hover:to-primary/10 hover:text-primary hover:scale-110 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1"
            )}
            title={name}
          >
            {/* Hover shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/item:translate-x-full transition-transform duration-700" />
            
            <Icon 
              size={28} 
              weight={selected === name ? "fill" : "duotone"} 
              className="group-hover/item:rotate-12 transition-transform duration-300 relative z-10"
            />
          </button>
        ))}
      </div>
    </div>
  );
};

export default IconPicker;
