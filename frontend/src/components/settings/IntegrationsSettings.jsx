import React, { useMemo, useState } from 'react';
import { gql, useMutation, useQuery } from '@apollo/client';

const GET_MY_OUTBOUND_WEBHOOKS = gql`
  query GetMyOutboundWebhooks {
    myOutboundWebhooks {
      id
      name
      url
      isActive
      eventTypes
      lastStatus
      lastResponse
      lastTriggeredAt
      createdAt
    }
  }
`;

const CREATE_OUTBOUND_WEBHOOK = gql`
  mutation CreateOutboundWebhook(
    $name: String!
    $url: String!
    $secret: String
    $eventTypes: [String]
    $isActive: Boolean
  ) {
    createOutboundWebhook(
      name: $name
      url: $url
      secret: $secret
      eventTypes: $eventTypes
      isActive: $isActive
    ) {
      webhook {
        id
      }
      success
      message
    }
  }
`;

const UPDATE_OUTBOUND_WEBHOOK = gql`
  mutation UpdateOutboundWebhook(
    $webhookId: ID!
    $name: String
    $url: String
    $secret: String
    $eventTypes: [String]
    $isActive: Boolean
  ) {
    updateOutboundWebhook(
      webhookId: $webhookId
      name: $name
      url: $url
      secret: $secret
      eventTypes: $eventTypes
      isActive: $isActive
    ) {
      success
      message
      webhook {
        id
      }
    }
  }
`;

const DELETE_OUTBOUND_WEBHOOK = gql`
  mutation DeleteOutboundWebhook($webhookId: ID!) {
    deleteOutboundWebhook(webhookId: $webhookId) {
      success
      message
    }
  }
`;

const TEST_OUTBOUND_WEBHOOK = gql`
  mutation TestOutboundWebhook($webhookId: ID!) {
    testOutboundWebhook(webhookId: $webhookId) {
      success
      message
    }
  }
`;

const EVENT_OPTIONS = [
  { value: 'analysis.completed', label: 'Analysis Completed' },
  { value: 'analysis.failed', label: 'Analysis Failed' },
  { value: 'payment.succeeded', label: 'Payment Succeeded' },
  { value: 'payment.failed', label: 'Payment Failed' },
];

export default function IntegrationsSettings() {
  const [form, setForm] = useState({
    name: '',
    url: '',
    secret: '',
    eventTypes: ['analysis.completed'],
  });
  const [message, setMessage] = useState(null);

  const { data, loading, refetch } = useQuery(GET_MY_OUTBOUND_WEBHOOKS);

  const [createWebhook, { loading: creating }] = useMutation(CREATE_OUTBOUND_WEBHOOK);
  const [updateWebhook, { loading: updating }] = useMutation(UPDATE_OUTBOUND_WEBHOOK);
  const [deleteWebhook, { loading: deleting }] = useMutation(DELETE_OUTBOUND_WEBHOOK);
  const [testWebhook, { loading: testing }] = useMutation(TEST_OUTBOUND_WEBHOOK);

  const webhooks = useMemo(() => data?.myOutboundWebhooks || [], [data]);

  const onEventToggle = (value) => {
    setForm((prev) => {
      const has = prev.eventTypes.includes(value);
      return {
        ...prev,
        eventTypes: has
          ? prev.eventTypes.filter((item) => item !== value)
          : [...prev.eventTypes, value],
      };
    });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setMessage(null);

    if (!form.name.trim() || !form.url.trim()) {
      setMessage({ type: 'error', text: 'Name and URL are required.' });
      return;
    }

    if (form.eventTypes.length === 0) {
      setMessage({ type: 'error', text: 'Select at least one event.' });
      return;
    }

    try {
      const { data: result } = await createWebhook({
        variables: {
          name: form.name.trim(),
          url: form.url.trim(),
          secret: form.secret.trim() || null,
          eventTypes: form.eventTypes,
          isActive: true,
        },
      });

      if (!result?.createOutboundWebhook?.success) {
        setMessage({ type: 'error', text: result?.createOutboundWebhook?.message || 'Could not create webhook.' });
        return;
      }

      setForm({ name: '', url: '', secret: '', eventTypes: ['analysis.completed'] });
      setMessage({ type: 'success', text: 'Webhook created successfully.' });
      await refetch();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Could not create webhook.' });
    }
  };

  const handleToggleActive = async (hook) => {
    setMessage(null);
    try {
      const { data: result } = await updateWebhook({
        variables: {
          webhookId: hook.id,
          isActive: !hook.isActive,
        },
      });

      if (!result?.updateOutboundWebhook?.success) {
        setMessage({ type: 'error', text: result?.updateOutboundWebhook?.message || 'Could not update webhook.' });
        return;
      }

      await refetch();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Could not update webhook.' });
    }
  };

  const handleDelete = async (hook) => {
    if (!window.confirm(`Delete webhook '${hook.name}'?`)) return;
    setMessage(null);

    try {
      const { data: result } = await deleteWebhook({ variables: { webhookId: hook.id } });
      if (!result?.deleteOutboundWebhook?.success) {
        setMessage({ type: 'error', text: result?.deleteOutboundWebhook?.message || 'Could not delete webhook.' });
        return;
      }
      setMessage({ type: 'success', text: 'Webhook deleted.' });
      await refetch();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Could not delete webhook.' });
    }
  };

  const handleTest = async (hook) => {
    setMessage(null);
    try {
      const { data: result } = await testWebhook({ variables: { webhookId: hook.id } });
      if (!result?.testOutboundWebhook?.success) {
        setMessage({ type: 'error', text: result?.testOutboundWebhook?.message || 'Could not send test webhook.' });
        return;
      }
      setMessage({ type: 'success', text: 'Test webhook dispatched. Check target endpoint logs.' });
      await refetch();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Could not send test webhook.' });
    }
  };

  return (
    <div>
      <div className="settings-section">
        <h2>Webhooks & Integrations</h2>
        <p className="subtitle">Configure outbound webhooks to notify your external systems.</p>

        {message && (
          <div className={`settings-info-card settings-callout ${message.type === 'error' ? 'error' : 'success'}`}>
            <p>{message.text}</p>
          </div>
        )}

        <form onSubmit={handleCreate}>
          <div className="settings-form-group">
            <label htmlFor="webhookName">Webhook Name</label>
            <input
              id="webhookName"
              type="text"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Production Integration"
              required
            />
          </div>

          <div className="settings-form-group">
            <label htmlFor="webhookUrl">Endpoint URL</label>
            <input
              id="webhookUrl"
              type="url"
              value={form.url}
              onChange={(e) => setForm((prev) => ({ ...prev, url: e.target.value }))}
              placeholder="https://example.com/webhooks/aia"
              required
            />
            <span className="input-hint">Your endpoint should accept POST JSON payloads.</span>
          </div>

          <div className="settings-form-group">
            <label htmlFor="webhookSecret">Signing Secret (optional)</label>
            <input
              id="webhookSecret"
              type="text"
              value={form.secret}
              onChange={(e) => setForm((prev) => ({ ...prev, secret: e.target.value }))}
              placeholder="shared secret for HMAC signature"
            />
            <span className="input-hint">If set, requests include <code>X-AIA-Signature</code> (HMAC SHA-256).</span>
          </div>

          <div className="settings-form-group">
            <label>Events</label>
            <div className="integration-events-grid">
              {EVENT_OPTIONS.map((option) => (
                <label key={option.value} className="integration-event-chip">
                  <input
                    type="checkbox"
                    checked={form.eventTypes.includes(option.value)}
                    onChange={() => onEventToggle(option.value)}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="settings-btn-group">
            <button type="submit" className="settings-btn settings-btn-primary" disabled={creating}>
              {creating ? 'Saving...' : 'Add Webhook'}
            </button>
          </div>
        </form>
      </div>

      <div className="settings-divider"></div>

      <div className="settings-section">
        <h2>Configured Integrations</h2>
        <p className="subtitle">Manage and test your webhook endpoints.</p>

        {loading ? (
          <div className="settings-info-card"><p>Loading integrations...</p></div>
        ) : webhooks.length === 0 ? (
          <div className="settings-info-card"><p>No webhooks configured yet.</p></div>
        ) : (
          <div className="settings-list">
            {webhooks.map((hook) => (
              <div className="settings-info-card" key={hook.id}>
                <div className="integration-row">
                  <div>
                    <h3>{hook.name}</h3>
                    <p>{hook.url}</p>
                    <p>
                      <strong>Status:</strong> {hook.isActive ? 'Active' : 'Disabled'} | <strong>Last code:</strong>{' '}
                      {hook.lastStatus ?? 'N/A'}
                    </p>
                    <p>
                      <strong>Last triggered:</strong>{' '}
                      {hook.lastTriggeredAt ? new Date(hook.lastTriggeredAt).toLocaleString() : 'Never'}
                    </p>
                    <div className="integration-events-inline">
                      {(hook.eventTypes || []).map((ev) => (
                        <span key={ev} className="integration-event-badge">{ev}</span>
                      ))}
                    </div>
                  </div>
                  <div className="settings-btn-group settings-actions-right">
                    <button
                      type="button"
                      className="settings-btn settings-btn-secondary"
                      onClick={() => handleToggleActive(hook)}
                      disabled={updating}
                    >
                      {hook.isActive ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      type="button"
                      className="settings-btn settings-btn-secondary"
                      onClick={() => handleTest(hook)}
                      disabled={testing || !hook.isActive}
                    >
                      Send Test
                    </button>
                    <button
                      type="button"
                      className="settings-btn settings-btn-danger"
                      onClick={() => handleDelete(hook)}
                      disabled={deleting}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
