"use client"

import * as React from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GrowthAnalytics } from "@/components/analytics/growth-analytics"
import { FunnelAnalytics } from "@/components/analytics/funnel-analytics"
import { ReferralAnalytics } from "@/components/analytics/referral-analytics"
import { QualityAnalytics } from "@/components/analytics/quality-analytics"
import {
  TrendingUp,
  Filter,
  Share2,
  Star,
} from "lucide-react"

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">
          User growth, activation funnel, referrals, and profile quality metrics
        </p>
      </div>

      <Tabs defaultValue="growth" className="space-y-6">
        <TabsList className="bg-gray-100 p-1 h-auto flex-wrap">
          <TabsTrigger
            value="growth"
            className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 py-2"
          >
            <TrendingUp className="h-4 w-4" />
            Growth & Retention
          </TabsTrigger>
          <TabsTrigger
            value="funnel"
            className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 py-2"
          >
            <Filter className="h-4 w-4" />
            Activation Funnel
          </TabsTrigger>
          <TabsTrigger
            value="referrals"
            className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 py-2"
          >
            <Share2 className="h-4 w-4" />
            Referrals
          </TabsTrigger>
          <TabsTrigger
            value="quality"
            className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm px-4 py-2"
          >
            <Star className="h-4 w-4" />
            Profile Quality
          </TabsTrigger>
        </TabsList>

        <TabsContent value="growth" className="mt-6">
          <GrowthAnalytics />
        </TabsContent>

        <TabsContent value="funnel" className="mt-6">
          <FunnelAnalytics />
        </TabsContent>

        <TabsContent value="referrals" className="mt-6">
          <ReferralAnalytics />
        </TabsContent>

        <TabsContent value="quality" className="mt-6">
          <QualityAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  )
}
