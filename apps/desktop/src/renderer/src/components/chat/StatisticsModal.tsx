import React from 'react';
import { X, MessageSquare, TrendingUp, Zap, Calendar, BarChart3, Cpu } from 'lucide-react';
import type { Statistics } from '../../hooks/useStatistics';

interface StatisticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  statistics: Statistics;
}

export function StatisticsModal({ isOpen, onClose, statistics }: StatisticsModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="glass-card bg-gray-900/95 rounded-2xl w-full max-w-4xl max-h-[85vh] overflow-y-auto m-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gray-900/95 backdrop-blur-sm border-b border-white/10 p-6 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-xl">
              <BarChart3 className="w-6 h-6 text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold">Statistiques d'utilisation</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Cartes de statistiques générales */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Total Messages */}
            <StatCard
              icon={<MessageSquare className="w-5 h-5" />}
              label="Total Messages"
              value={statistics.totalMessages}
              subtitle={`${statistics.userMessages} envoyés, ${statistics.assistantMessages} reçus`}
              color="blue"
            />

            {/* Conversations */}
            <StatCard
              icon={<TrendingUp className="w-5 h-5" />}
              label="Conversations"
              value={statistics.totalConversations}
              subtitle={`Moyenne: ${statistics.averageMessagesPerConversation} messages/conv`}
              color="green"
            />

            {/* Modèle favori */}
            <StatCard
              icon={<Cpu className="w-5 h-5" />}
              label="Modèle favori"
              value={statistics.mostUsedModel}
              subtitle={`${statistics.modelUsage[0]?.percentage || 0}% d'utilisation`}
              color="purple"
              valueIsString
            />
          </div>

          {/* Activité par période */}
          <div className="glass-card bg-white/5 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-semibold">Activité par période</h3>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <PeriodCard label="Aujourd'hui" messages={statistics.messagesToday} conversations={statistics.conversationsToday} />
              <PeriodCard label="Cette semaine" messages={statistics.messagesThisWeek} conversations={statistics.conversationsThisWeek} />
              <PeriodCard label="Ce mois" messages={statistics.messagesThisMonth} conversations={statistics.conversationsThisMonth} />
            </div>
          </div>

          {/* Activité des 7 derniers jours */}
          <div className="glass-card bg-white/5 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-yellow-400" />
              <h3 className="text-lg font-semibold">Activité des 7 derniers jours</h3>
            </div>

            <div className="space-y-3">
              {statistics.dailyActivity.map((day, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{day.date}</span>
                    <span className="font-medium">
                      {day.messages} messages · {day.conversations} conversations
                    </span>
                  </div>
                  <div className="relative h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, (day.messages / Math.max(...statistics.dailyActivity.map(d => d.messages), 1)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Usage des modèles */}
          <div className="glass-card bg-white/5 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Cpu className="w-5 h-5 text-purple-400" />
              <h3 className="text-lg font-semibold">Modèles utilisés</h3>
            </div>

            <div className="space-y-3">
              {statistics.modelUsage.map((model, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{model.model}</span>
                    <span className="text-muted-foreground">
                      {model.count} conversations ({model.percentage}%)
                    </span>
                  </div>
                  <div className="relative h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
                      style={{ width: `${model.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Moyennes et insights */}
          <div className="glass-card bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4">📊 Insights</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground mb-1">Moyenne messages par conversation</div>
                <div className="text-2xl font-bold text-blue-400">
                  {statistics.averageMessagesPerConversation}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1">Conversations par jour (moyenne)</div>
                <div className="text-2xl font-bold text-purple-400">
                  {statistics.averageConversationsPerDay}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1">Ratio utilisateur/assistant</div>
                <div className="text-2xl font-bold text-green-400">
                  {statistics.userMessages > 0
                    ? `${Math.round((statistics.assistantMessages / statistics.userMessages) * 100)}%`
                    : '0%'}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1">Conversations actives cette semaine</div>
                <div className="text-2xl font-bold text-yellow-400">
                  {statistics.conversationsThisWeek}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Composant pour une carte de statistique
interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  subtitle: string;
  color: 'blue' | 'green' | 'purple';
  valueIsString?: boolean;
}

function StatCard({ icon, label, value, subtitle, color, valueIsString }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-500/20 text-blue-400',
    green: 'bg-green-500/20 text-green-400',
    purple: 'bg-purple-500/20 text-purple-400',
  };

  return (
    <div className="glass-card bg-white/5 rounded-xl p-4">
      <div className={`inline-flex p-2 rounded-lg mb-3 ${colorClasses[color]}`}>
        {icon}
      </div>
      <div className="text-sm text-muted-foreground mb-1">{label}</div>
      <div className={`text-3xl font-bold mb-1 ${valueIsString ? 'text-lg' : ''}`}>
        {value}
      </div>
      <div className="text-xs text-muted-foreground">{subtitle}</div>
    </div>
  );
}

// Composant pour les cartes de période
interface PeriodCardProps {
  label: string;
  messages: number;
  conversations: number;
}

function PeriodCard({ label, messages, conversations }: PeriodCardProps) {
  return (
    <div className="bg-white/5 rounded-lg p-4 text-center">
      <div className="text-xs text-muted-foreground mb-2">{label}</div>
      <div className="text-2xl font-bold mb-1">{messages}</div>
      <div className="text-xs text-muted-foreground">messages</div>
      <div className="text-sm font-medium text-blue-400 mt-2">{conversations} conversations</div>
    </div>
  );
}
