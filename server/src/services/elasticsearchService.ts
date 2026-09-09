import { Client } from '@elastic/elasticsearch';
import { EmailSchedule } from '../models';
import dotenv from 'dotenv';
dotenv.config();

const ELASTIC_NODE = process.env.ELASTICSEARCH_NODE || 'http://127.0.0.1:9200';
const INDEX_NAME = 'reachinbox-emails';

class ElasticsearchService {
  private client: Client;
  private isConnected = false;

  constructor() {
    this.client = new Client({
      node: ELASTIC_NODE,
      auth: process.env.ELASTICSEARCH_API_KEY
        ? { apiKey: process.env.ELASTICSEARCH_API_KEY }
        : undefined,
    });
    this.initIndex();
  }

  async initIndex() {
    try {
      const ping = await this.client.ping();
      if (ping) {
        this.isConnected = true;
        console.log(`[Elasticsearch] Connected to ${ELASTIC_NODE}`);

        const exists = await this.client.indices.exists({ index: INDEX_NAME });
        if (!exists) {
          await this.client.indices.create({
            index: INDEX_NAME,
            body: {
              mappings: {
                properties: {
                  id: { type: 'keyword' },
                  toEmail: { type: 'text', fields: { keyword: { type: 'keyword' } } },
                  toName: { type: 'text' },
                  fromEmail: { type: 'keyword' },
                  subject: { type: 'text', analyzer: 'standard' },
                  body: { type: 'text', analyzer: 'standard' },
                  status: { type: 'keyword' },
                  scheduledFor: { type: 'date' },
                  sentAt: { type: 'date' },
                  etherealPreviewUrl: { type: 'keyword' },
                  createdAt: { type: 'date' },
                },
              },
            },
          });
          console.log(`[Elasticsearch] Index '${INDEX_NAME}' created.`);
        }
      }
    } catch (err: any) {
      this.isConnected = false;
      console.log(`[Elasticsearch Notice] Cluster at ${ELASTIC_NODE} offline. Using MongoDB search fallback.`);
    }
  }

  async indexEmail(email: {
    id: string;
    toEmail: string;
    toName?: string | null;
    fromEmail: string;
    subject: string;
    body: string;
    status: string;
    scheduledFor: Date;
    sentAt?: Date | null;
    etherealPreviewUrl?: string | null;
  }) {
    if (!this.isConnected) return;
    try {
      await this.client.index({
        index: INDEX_NAME,
        id: email.id,
        document: {
          id: email.id,
          toEmail: email.toEmail,
          toName: email.toName,
          fromEmail: email.fromEmail,
          subject: email.subject,
          body: email.body.replace(/<[^>]+>/g, ' '),
          status: email.status,
          scheduledFor: email.scheduledFor.toISOString(),
          sentAt: email.sentAt ? email.sentAt.toISOString() : null,
          etherealPreviewUrl: email.etherealPreviewUrl,
          createdAt: new Date().toISOString(),
        },
      });
      await this.client.indices.refresh({ index: INDEX_NAME });
    } catch (err: any) {
      console.warn('[Elasticsearch] Indexing warning:', err.message);
    }
  }

  async searchEmails(queryText: string) {
    if (this.isConnected) {
      try {
        const result = await this.client.search({
          index: INDEX_NAME,
          body: {
            query: {
              multi_match: {
                query: queryText,
                fields: ['subject^3', 'body', 'toEmail^2', 'toName', 'fromEmail'],
                fuzziness: 'AUTO',
              },
            },
            highlight: {
              fields: {
                subject: {},
                body: {},
              },
            },
          },
        });

        const hits = result.hits.hits.map(hit => ({
          ...(hit._source as any),
          highlight: hit.highlight,
          score: hit._score,
        }));
        return hits;
      } catch (err: any) {
        console.warn('[Elasticsearch] Search query error, falling back to DB:', err.message);
      }
    }

    // Fallback: MongoDB Search
    const regex = new RegExp(queryText, 'i');
    const dbResults = await EmailSchedule.find({
      $or: [
        { subject: { $regex: regex } },
        { body: { $regex: regex } },
        { toEmail: { $regex: regex } },
        { toName: { $regex: regex } },
        { fromEmail: { $regex: regex } },
      ],
    }).sort({ createdAt: -1 });

    return dbResults.map(d => ({ ...d.toObject(), id: d._id.toString() }));
  }
}

export const elasticsearchService = new ElasticsearchService();
