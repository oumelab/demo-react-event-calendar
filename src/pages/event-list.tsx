import {Link} from "react-router-dom";
import {CalendarDays, MapPin, Users} from "lucide-react";
import {type Event, EVENTS as events} from "../constants";
import Card from "../components/card";

export default function EventList() {
  return (
    <section className="space-y-6 max-w-3xl mx-auto">
      {events.map((event: Event) => (
        <Card key={event.id} hoverShadow>
          <Link to={`/events/${event.id}`} className="space-y-12">
            <div className="flex flex-col space-y-2">
              <div className="font-bold text-2xl leading-none tracking-tight">
                {event.title}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {event.description}
              </div>
            </div>

            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center">
                <CalendarDays className="w-4 h-4 mr-2 text-blue-500" />
                <span>{event.date}〜</span>
              </div>
              <div className="flex items-center">
                <MapPin className="w-4 h-4 mr-2 text-green-500" />
                <span>{event.location}</span>
              </div>
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-2 text-purple-500" />
                <span>
                  {event.attendees}
                  {event.capacity && `/${event.capacity}`}
                  人参加予定
                </span>
              </div>
            </div>
          </Link>
        </Card>
      ))}
    </section>
  );
}
