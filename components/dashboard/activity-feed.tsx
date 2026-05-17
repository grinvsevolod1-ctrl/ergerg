'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  GitCommit,
  GitMerge,
  GitPullRequest,
  MessageSquare,
  CircleDot
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Activity {
  id: number
  type: 'commit' | 'pull_request' | 'issue' | 'review' | 'merge'
  title: string
  description?: string | null
  url?: string | null
  created_at: string
  contributor_username: string
  contributor_avatar?: string | null
  repository_name: string
}

interface ActivityFeedProps {
  activities: Activity[]
  className?: string
}

const activityIcons = {
  commit: GitCommit,
  pull_request: GitPullRequest,
  issue: CircleDot,
  review: MessageSquare,
  merge: GitMerge
}

const activityColors = {
  commit: 'text-emerald-500',
  pull_request: 'text-blue-500',
  issue: 'text-amber-500',
  review: 'text-purple-500',
  merge: 'text-violet-500'
}

export function ActivityFeed({ activities, className }: ActivityFeedProps) {
  if (!activities.length) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No recent activity
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          <div className="space-y-0">
            {activities.map((activity, index) => {
              const Icon = activityIcons[activity.type]
              const colorClass = activityColors[activity.type]
              const initials = activity.contributor_username
                .split(/[._-]/)
                .map((part) => part[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)

              return (
                <div
                  key={activity.id}
                  className={cn(
                    'flex items-start gap-4 px-6 py-4',
                    index !== activities.length - 1 && 'border-b'
                  )}
                >
                  <div className={cn('mt-0.5', colorClass)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarImage
                          src={activity.contributor_avatar || undefined}
                          alt={activity.contributor_username}
                        />
                        <AvatarFallback className="text-[10px]">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium truncate">
                        {activity.contributor_username}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        in {activity.repository_name}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {activity.url ? (
                        <a
                          href={activity.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-foreground transition-colors"
                        >
                          {activity.title}
                        </a>
                      ) : (
                        activity.title
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(activity.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
