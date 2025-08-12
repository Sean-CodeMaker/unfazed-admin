import type { Request, Response } from 'express';

const waitTime = (time: number = 100) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(true);
        }, time);
    });
};

// Crown model mock data
const crownData = [
    {
        id: 1,
        name: 'Golden Crown',
        type: 'gold',
        level: 5,
        price: 9999.99,
        description: 'Legendary golden crown symbolizing supreme power and authority',
        is_active: true,
        created_at: '2024-01-15T10:30:00Z',
        updated_at: '2024-01-20T14:20:00Z',
        owner: 'King Arthur',
        weight: 2.5,
        material: 'pure_gold',
        gems: ['diamond', 'ruby', 'emerald'],
        region: 'Europe',
        status: 'available'
    },
    {
        id: 2,
        name: 'Diamond Crown',
        type: 'diamond',
        level: 6,
        price: 19999.99,
        description: 'Magnificent crown adorned with 99 sparkling diamonds',
        is_active: true,
        created_at: '2024-01-16T09:15:00Z',
        updated_at: '2024-01-22T16:45:00Z',
        owner: 'Queen Elizabeth',
        weight: 1.8,
        material: 'platinum',
        gems: ['diamond'],
        region: 'Britain',
        status: 'reserved'
    },
    {
        id: 3,
        name: 'Jade Crown',
        type: 'jade',
        level: 4,
        price: 8888.88,
        description: 'Oriental crown carved from finest jade stones',
        is_active: false,
        created_at: '2024-01-17T15:20:00Z',
        updated_at: '2024-01-25T11:30:00Z',
        owner: 'Emperor Wu',
        weight: 3.2,
        material: 'jade',
        gems: ['jade', 'pearl'],
        region: 'Asia',
        status: 'sold'
    },
    {
        id: 4,
        name: 'Crystal Crown',
        type: 'crystal',
        level: 3,
        price: 5555.55,
        description: 'Pure and flawless crystal crown with crystalline transparency',
        is_active: true,
        created_at: '2024-01-18T12:00:00Z',
        updated_at: '2024-01-26T09:10:00Z',
        owner: 'Ice Queen',
        weight: 1.2,
        material: 'crystal',
        gems: ['crystal'],
        region: 'Arctic',
        status: 'available'
    },
    {
        id: 5,
        name: 'Ruby Crown',
        type: 'ruby',
        level: 5,
        price: 12345.67,
        description: 'Blood-red ruby crown imbued with mysterious powers',
        is_active: true,
        created_at: '2024-01-19T08:45:00Z',
        updated_at: '2024-01-27T13:25:00Z',
        owner: 'Fire Lord',
        weight: 2.1,
        material: 'gold',
        gems: ['ruby', 'garnet'],
        region: 'Middle East',
        status: 'maintenance'
    },
    {
        id: 6,
        name: 'Sapphire Crown',
        type: 'sapphire',
        level: 5,
        price: 11111.11,
        description: 'Deep blue sapphire crown mysterious as the ocean depths',
        is_active: true,
        created_at: '2024-01-20T14:30:00Z',
        updated_at: '2024-01-28T10:15:00Z',
        owner: 'Sea King',
        weight: 2.3,
        material: 'silver',
        gems: ['sapphire', 'aquamarine'],
        region: 'Oceania',
        status: 'available'
    },
    {
        id: 7,
        name: 'Rainbow Crown',
        type: 'rainbow',
        level: 7,
        price: 25000.00,
        description: 'Ultimate crown combining all precious gems in harmony',
        is_active: true,
        created_at: '2024-01-21T16:20:00Z',
        updated_at: '2024-01-29T12:40:00Z',
        owner: 'Rainbow Monarch',
        weight: 3.5,
        material: 'mythril',
        gems: ['diamond', 'ruby', 'emerald', 'sapphire', 'topaz', 'amethyst'],
        region: 'Fantasy',
        status: 'legendary'
    },
    {
        id: 8,
        name: 'Antique Crown',
        type: 'antique',
        level: 4,
        price: 7777.77,
        description: 'Ancient crown with a thousand years of history',
        is_active: false,
        created_at: '2024-01-22T11:10:00Z',
        updated_at: '2024-01-30T15:55:00Z',
        owner: 'Ancient Emperor',
        weight: 4.0,
        material: 'bronze',
        gems: ['turquoise', 'lapis'],
        region: 'Ancient',
        status: 'museum'
    }
];

// Crown History model mock data
const crownHistoryData = [
    {
        id: 1,
        crown_id: 1,
        event_type: 'created',
        description: 'Crown was forged by master craftsman in the royal forge',
        event_date: '2024-01-15T10:30:00Z',
        created_at: '2024-01-15T10:30:00Z',
        updated_at: '2024-01-15T10:30:00Z'
    },
    {
        id: 2,
        crown_id: 1,
        event_type: 'transferred',
        description: 'Crown transferred to King Arthur during coronation ceremony',
        event_date: '2024-01-16T14:00:00Z',
        created_at: '2024-01-16T14:00:00Z',
        updated_at: '2024-01-16T14:00:00Z'
    },
    {
        id: 3,
        crown_id: 1,
        event_type: 'maintenance',
        description: 'Regular maintenance and gem polishing performed',
        event_date: '2024-01-20T09:15:00Z',
        created_at: '2024-01-20T09:15:00Z',
        updated_at: '2024-01-20T09:15:00Z'
    },
    {
        id: 4,
        crown_id: 2,
        event_type: 'created',
        description: 'Diamond Crown crafted with 99 premium diamonds',
        event_date: '2024-01-16T09:15:00Z',
        created_at: '2024-01-16T09:15:00Z',
        updated_at: '2024-01-16T09:15:00Z'
    },
    {
        id: 5,
        crown_id: 2,
        event_type: 'reserved',
        description: 'Crown reserved for Queen Elizabeth special ceremony',
        event_date: '2024-01-22T11:30:00Z',
        created_at: '2024-01-22T11:30:00Z',
        updated_at: '2024-01-22T11:30:00Z'
    },
    {
        id: 6,
        crown_id: 3,
        event_type: 'created',
        description: 'Jade Crown carved from ancient jade stone',
        event_date: '2024-01-17T08:45:00Z',
        created_at: '2024-01-17T08:45:00Z',
        updated_at: '2024-01-17T08:45:00Z'
    },
    {
        id: 7,
        crown_id: 3,
        event_type: 'appraised',
        description: 'Crown appraised by jade expert, confirmed authenticity',
        event_date: '2024-01-18T15:20:00Z',
        created_at: '2024-01-18T15:20:00Z',
        updated_at: '2024-01-18T15:20:00Z'
    },
    {
        id: 8,
        crown_id: 4,
        event_type: 'created',
        description: 'Silver Crown forged with traditional techniques',
        event_date: '2024-01-18T12:00:00Z',
        created_at: '2024-01-18T12:00:00Z',
        updated_at: '2024-01-18T12:00:00Z'
    },
    {
        id: 9,
        crown_id: 4,
        event_type: 'sold',
        description: 'Crown sold to Noble House collector',
        event_date: '2024-01-21T10:45:00Z',
        created_at: '2024-01-21T10:45:00Z',
        updated_at: '2024-01-21T10:45:00Z'
    },
    {
        id: 10,
        crown_id: 5,
        event_type: 'created',
        description: 'Crystal Crown crafted with rare magical crystals',
        event_date: '2024-01-19T16:30:00Z',
        created_at: '2024-01-19T16:30:00Z',
        updated_at: '2024-01-19T16:30:00Z'
    },
    {
        id: 11,
        crown_id: 1,
        event_type: 'inspection',
        description: 'Annual quality inspection completed successfully',
        event_date: '2024-01-25T14:00:00Z',
        created_at: '2024-01-25T14:00:00Z',
        updated_at: '2024-01-25T14:00:00Z'
    },
    {
        id: 12,
        crown_id: 2,
        event_type: 'exhibition',
        description: 'Crown displayed in Royal Heritage Exhibition',
        event_date: '2024-01-26T10:00:00Z',
        created_at: '2024-01-26T10:00:00Z',
        updated_at: '2024-01-26T10:00:00Z'
    }
];

// Crown Tags model mock data (m2m relation)
const crownTagsData = [
    { id: 1, name: 'luxury', description: 'High-end luxury items' },
    { id: 2, name: 'antique', description: 'Historical antique pieces' },
    { id: 3, name: 'royal', description: 'Royal collection items' },
    { id: 4, name: 'ceremonial', description: 'Used in ceremonies' },
    { id: 5, name: 'decorative', description: 'Decorative purposes only' },
    { id: 6, name: 'museum', description: 'Museum exhibition pieces' },
    { id: 7, name: 'rare', description: 'Rare and unique items' },
    { id: 8, name: 'valuable', description: 'High monetary value' }
];

// Crown Certificates model mock data (fk relation)
const crownCertificatesData = [
    {
        id: 1,
        crown_id: 1,
        certificate_type: 'authenticity',
        issuer: 'Royal Authentication Society',
        issue_date: '2024-01-15T10:00:00Z',
        expiry_date: '2026-01-15T10:00:00Z',
        certificate_number: 'RAS-2024-001',
        status: 'active'
    },
    {
        id: 2,
        crown_id: 1,
        certificate_type: 'appraisal',
        issuer: 'International Gem Institute',
        issue_date: '2024-01-16T14:30:00Z',
        expiry_date: '2025-01-16T14:30:00Z',
        certificate_number: 'IGI-2024-001',
        status: 'active'
    },
    {
        id: 3,
        crown_id: 2,
        certificate_type: 'authenticity',
        issuer: 'Royal Authentication Society',
        issue_date: '2024-01-17T09:00:00Z',
        expiry_date: '2026-01-17T09:00:00Z',
        certificate_number: 'RAS-2024-002',
        status: 'active'
    },
    {
        id: 4,
        crown_id: 3,
        certificate_type: 'heritage',
        issuer: 'Heritage Preservation Council',
        issue_date: '2024-01-18T11:00:00Z',
        expiry_date: '2029-01-18T11:00:00Z',
        certificate_number: 'HPC-2024-001',
        status: 'active'
    }
];

// Crown Insurance model mock data (o2o relation)
const crownInsuranceData = [
    {
        id: 1,
        crown_id: 1,
        policy_number: 'POL-2024-001',
        insurance_company: 'Royal Heritage Insurance Co.',
        coverage_amount: 15000000.00,
        premium_amount: 25000.00,
        start_date: '2024-01-01T00:00:00Z',
        end_date: '2024-12-31T23:59:59Z',
        policy_type: 'comprehensive',
        status: 'active'
    },
    {
        id: 2,
        crown_id: 2,
        policy_number: 'POL-2024-002',
        insurance_company: 'Premium Artifacts Insurance',
        coverage_amount: 25000000.00,
        premium_amount: 45000.00,
        start_date: '2024-01-01T00:00:00Z',
        end_date: '2024-12-31T23:59:59Z',
        policy_type: 'comprehensive',
        status: 'active'
    },
    {
        id: 3,
        crown_id: 3,
        policy_number: 'POL-2024-003',
        insurance_company: 'Heritage Protection Insurance',
        coverage_amount: 8000000.00,
        premium_amount: 15000.00,
        start_date: '2024-01-01T00:00:00Z',
        end_date: '2024-12-31T23:59:59Z',
        policy_type: 'basic',
        status: 'active'
    }
];

const crownModelDesc = {
    fields: {
        id: {
            type: 'IntegerField' as const,
            readonly: true,
            show: true,
            blank: false,
            choices: [],
            help_text: 'Unique identifier for the crown',
            default: null,
            name: 'ID'
        },
        name: {
            type: 'CharField' as const,
            readonly: false,
            show: true,
            blank: false,
            choices: [],
            help_text: 'Name of the crown',
            default: '',
            name: 'Name'
        },
        type: {
            type: 'CharField' as const,
            readonly: false,
            show: true,
            blank: false,
            choices: [
                ['gold', 'Gold'],
                ['diamond', 'Diamond'],
                ['jade', 'Jade'],
                ['crystal', 'Crystal'],
                ['ruby', 'Ruby'],
                ['sapphire', 'Sapphire'],
                ['rainbow', 'Rainbow'],
                ['antique', 'Antique']
            ],
            help_text: 'Type of the crown',
            default: 'gold',
            name: 'Type'
        },
        level: {
            type: 'IntegerField' as const,
            readonly: false,
            show: false,
            blank: false,
            choices: [
                [1, 'Common'],
                [2, 'Excellent'],
                [3, 'Rare'],
                [4, 'Epic'],
                [5, 'Legendary'],
                [6, 'Mythic'],
                [7, 'Supreme']
            ],
            help_text: 'Level of the crown (1-7)',
            default: 1,
            name: 'Level'
        },
        price: {
            type: 'FloatField' as const,
            readonly: false,
            show: true,
            blank: false,
            choices: [],
            help_text: 'Price of the crown',
            default: 0.0,
            name: 'Price'
        },
        description: {
            type: 'TextField' as const,
            readonly: false,
            show: true,
            blank: true,
            choices: [],
            help_text: 'Detailed description of the crown',
            default: '',
            name: 'Description'
        },
        is_active: {
            type: 'BooleanField' as const,
            readonly: false,
            show: true,
            blank: false,
            choices: [],
            help_text: 'Whether the crown is active',
            default: true,
            name: 'Active Status'
        },
        created_at: {
            type: 'DatetimeField' as const,
            readonly: true,
            show: true,
            blank: false,
            choices: [],
            help_text: 'Creation time',
            default: null,
            name: 'Created At'
        },
        updated_at: {
            type: 'DatetimeField' as const,
            readonly: true,
            show: true,
            blank: false,
            choices: [],
            help_text: 'Last update time',
            default: null,
            name: 'Updated At'
        },
        owner: {
            type: 'CharField' as const,
            readonly: false,
            show: true,
            blank: true,
            choices: [],
            help_text: 'Owner of the crown',
            default: '',
            name: 'Owner'
        },
        weight: {
            type: 'FloatField' as const,
            readonly: false,
            show: true,
            blank: false,
            choices: [],
            help_text: 'Weight of the crown (in kg)',
            default: 0.0,
            name: 'Weight'
        },
        material: {
            type: 'CharField' as const,
            readonly: false,
            show: true,
            blank: false,
            choices: [
                ['gold', 'Gold'],
                ['silver', 'Silver'],
                ['platinum', 'Platinum'],
                ['bronze', 'Bronze'],
                ['jade', 'Jade'],
                ['crystal', 'Crystal'],
                ['mythril', 'Mythril']
            ],
            help_text: 'Primary material of the crown',
            default: 'gold',
            name: 'Material'
        },
        region: {
            type: 'CharField' as const,
            readonly: false,
            show: true,
            blank: true,
            choices: [
                ['Europe', 'Europe'],
                ['Asia', 'Asia'],
                ['Africa', 'Africa'],
                ['America', 'America'],
                ['Oceania', 'Oceania'],
                ['Arctic', 'Arctic'],
                ['Middle East', 'Middle East'],
                ['Ancient', 'Ancient'],
                ['Fantasy', 'Fantasy']
            ],
            help_text: 'Region of origin',
            default: '',
            name: 'Region'
        },
        status: {
            type: 'CharField' as const,
            readonly: false,
            show: true,
            blank: false,
            choices: [
                ['available', 'Available'],
                ['reserved', 'Reserved'],
                ['sold', 'Sold'],
                ['maintenance', 'Maintenance'],
                ['museum', 'Museum'],
                ['legendary', 'Legendary']
            ],
            help_text: 'Current status of the crown',
            default: 'available',
            name: 'Status'
        }
    },
    actions: {
        activate: {
            name: 'Activate',
            raw_name: 'activate',
            output: 0,
            confirm: true,
            description: 'Activate selected crowns',
            batch: true,
            extra: {}
        },
        deactivate: {
            name: 'Deactivate',
            raw_name: 'deactivate',
            output: 0,
            confirm: true,
            description: 'Deactivate selected crowns',
            batch: true,
            extra: {}
        },
        set_maintenance: {
            name: 'Set Maintenance',
            raw_name: 'set_maintenance',
            output: 0,
            confirm: true,
            description: 'Set selected crowns to maintenance status',
            batch: false,
            extra: {}
        },
        export_data: {
            name: 'Export Data',
            raw_name: 'export_data',
            output: 1,
            confirm: false,
            description: 'Export data of selected crowns',
            batch: false,
            extra: {
                format: 'excel'
            }
        }
    },
    attrs: {
        help_text: 'Crown Management System - Manage various types of crown information',
        can_search: true,
        search_fields: ['name', 'type', 'owner', 'material', 'region', 'status'],
        can_add: true,
        can_delete: true,
        can_edit: true,
        can_show_all: true,
        list_per_page: 20,
        list_search: ['name', 'type', 'owner', 'status'],
        list_filter: ['type', 'level', 'material', 'region', 'status', 'is_active'],
        list_sort: ['id', 'name', 'price', 'level', 'created_at', 'updated_at'],
        list_order: ['-created_at'],
        editable: true,
        detail_display: ['id', 'name', 'type', 'level', 'price', 'description', 'owner', 'weight', 'material', 'region', 'status', 'is_active', 'created_at', 'updated_at']
    }
};

export default {
    // 获取 Crown 模型描述
    'POST /api/admin/model-desc': async (req: Request, res: Response) => {
        const { name } = req.body;
        await waitTime(500);

        if (name === 'crown') {
            res.send({
                code: 0,
                message: 'success',
                data: crownModelDesc
            });
        } else if (name === 'crown_history') {
            res.send({
                code: 0,
                message: 'success',
                data: {
                    fields: {
                        id: {
                            type: 'IntegerField' as const,
                            readonly: true,
                            show: true,
                            blank: false,
                            choices: [],
                            help_text: 'History record ID',
                            default: null,
                            name: 'ID'
                        },
                        crown_id: {
                            type: 'IntegerField' as const,
                            readonly: false,
                            show: true,
                            blank: false,
                            choices: [],
                            help_text: 'Associated crown ID',
                            default: null,
                            name: 'Crown ID'
                        },
                        event_type: {
                            type: 'CharField' as const,
                            readonly: false,
                            show: true,
                            blank: false,
                            choices: [
                                ['created', 'Created'],
                                ['transferred', 'Transferred'],
                                ['maintenance', 'Maintenance'],
                                ['reserved', 'Reserved'],
                                ['sold', 'Sold'],
                                ['appraised', 'Appraised'],
                                ['inspection', 'Inspection'],
                                ['exhibition', 'Exhibition'],
                            ],
                            help_text: 'Type of historical event',
                            default: 'created',
                            name: 'Event Type'
                        },
                        description: {
                            type: 'TextField' as const,
                            readonly: false,
                            show: true,
                            blank: true,
                            choices: [],
                            help_text: 'Detailed description of the event',
                            default: null,
                            name: 'Description'
                        },
                        event_date: {
                            type: 'DatetimeField' as const,
                            readonly: false,
                            show: true,
                            blank: false,
                            choices: [],
                            help_text: 'When the event occurred',
                            default: null,
                            name: 'Event Date'
                        },
                        created_at: {
                            type: 'DatetimeField' as const,
                            readonly: true,
                            show: true,
                            blank: false,
                            choices: [],
                            help_text: 'Record creation time',
                            default: null,
                            name: 'Created At'
                        },
                        updated_at: {
                            type: 'DatetimeField' as const,
                            readonly: true,
                            show: true,
                            blank: false,
                            choices: [],
                            help_text: 'Record last update time',
                            default: null,
                            name: 'Updated At'
                        }
                    },
                    actions: {},
                    attrs: {
                        help_text: 'Crown History Records',
                        can_search: true,
                        search_fields: ['event_type', 'description'],
                        can_add: true,
                        can_delete: true,
                        can_edit: true,
                        can_show_all: true,
                        list_per_page: 10,
                        list_search: [],
                        list_filter: ['event_type'],
                        list_sort: ['event_date'],
                        list_order: ['-event_date'],
                        editable: true,
                        detail_display: ['id', 'crown_id', 'event_type', 'description', 'event_date', 'created_at', 'updated_at']
                    }
                }
            });
        } else {
            res.send({
                code: 1,
                message: `Model ${name} not found`,
                data: null
            });
        }
    },

    // 获取 Crown 模型数据
    'POST /api/admin/model-data': async (req: Request, res: Response) => {
        const { name, page = 1, size = 20, cond = [] } = req.body;
        await waitTime(300);

        let filteredData: any[] = [];

        if (name === 'crown') {
            filteredData = [...crownData];
        } else if (name === 'crown_history') {
            filteredData = [...crownHistoryData];
        } else if (name === 'crown_tags') {
            filteredData = [...crownTagsData];
        } else if (name === 'crown_certificates') {
            filteredData = [...crownCertificatesData];
        } else if (name === 'crown_insurance') {
            filteredData = [...crownInsuranceData];
        } else {
            res.send({
                code: 1,
                message: `Model ${name} not found`,
                data: null
            });
            return;
        }

        // 应用搜索条件
        if (cond && cond.length > 0) {
            cond.forEach((condition: any) => {
                const { field, eq, lt, lte, gt, gte, contains, icontains } = condition;

                filteredData = filteredData.filter(item => {
                    const value = (item as any)[field];

                    if (eq !== undefined && eq !== null) {
                        return value === eq || String(value) === String(eq);
                    }
                    if (lt !== undefined && lt !== null) {
                        return value < lt;
                    }
                    if (lte !== undefined && lte !== null) {
                        return value <= lte;
                    }
                    if (gt !== undefined && gt !== null) {
                        return value > gt;
                    }
                    if (gte !== undefined && gte !== null) {
                        return value >= gte;
                    }
                    if (contains !== undefined && contains !== null) {
                        return String(value).includes(String(contains));
                    }
                    if (icontains !== undefined && icontains !== null) {
                        return String(value).toLowerCase().includes(String(icontains).toLowerCase());
                    }

                    return true;
                });
            });
        }

        // 分页
        const total = filteredData.length;
        const startIndex = (page - 1) * size;
        const endIndex = Math.min(startIndex + size, total);
        const paginatedData = filteredData.slice(startIndex, endIndex);

        res.send({
            code: 0,
            message: 'success',
            data: {
                count: total,
                data: paginatedData
            }
        });
    },

    // Crown 模型操作
    'POST /api/admin/model-action': async (req: Request, res: Response) => {
        const { name, action, data } = req.body;
        await waitTime(800);

        if (name !== 'crown') {
            res.send({
                code: 1,
                message: `Model ${name} not found`,
                data: null
            });
            return;
        }

        // Simulate operation processing
        let result;
        switch (action) {
            case 'activate':
                result = { message: `Crown ${data.name} has been activated`, affected: 1 };
                break;
            case 'deactivate':
                result = { message: `Crown ${data.name} has been deactivated`, affected: 1 };
                break;
            case 'set_maintenance':
                result = { message: `Crown ${data.name} has been set to maintenance status`, affected: 1 };
                break;
            case 'export_data':
                result = {
                    message: 'Data export completed',
                    download_url: '/api/download/crown_export.xlsx',
                    affected: 1
                };
                break;
            default:
                res.send({
                    code: 1,
                    message: `Unknown action: ${action}`,
                    data: null
                });
                return;
        }

        res.send({
            code: 0,
            message: 'success',
            data: result
        });
    },

    // Crown 模型删除
    'POST /api/admin/model-delete': async (req: Request, res: Response) => {
        const { name, data } = req.body;
        await waitTime(600);

        if (name !== 'crown') {
            res.send({
                code: 1,
                message: `Model ${name} not found`,
                data: null
            });
            return;
        }

        const deletedCount = Array.isArray(data) ? data.length : 1;

        res.send({
            code: 0,
            message: 'success',
            data: {
                message: `Successfully deleted ${deletedCount} crown record(s)`,
                deleted_count: deletedCount
            }
        });
    },

    // Crown 模型保存
    'POST /api/admin/model-save': async (req: Request, res: Response) => {
        const { name, data, inlines } = req.body;
        await waitTime(800);

        if (name !== 'crown') {
            res.send({
                code: 1,
                message: `Model ${name} not found`,
                data: null
            });
            return;
        }

        // Simulate save operation
        const isUpdate = data.id;
        const savedData = {
            ...data,
            id: data.id || Math.max(...crownData.map(item => item.id)) + 1,
            updated_at: new Date().toISOString(),
            created_at: data.created_at || new Date().toISOString()
        };

        res.send({
            code: 0,
            message: 'success',
            data: {
                message: isUpdate ? 'Crown information updated successfully' : 'New crown created successfully',
                saved_data: savedData,
                is_update: isUpdate
            }
        });
    },

    // Crown 模型详情
    'POST /api/admin/model-detail': async (req: Request, res: Response) => {
        const { name, data } = req.body;
        await waitTime(500);

        if (name !== 'crown') {
            res.send({
                code: 1,
                message: `Model ${name} not found`,
                data: null
            });
            return;
        }

        // 模拟返回关联模型信息
        res.send({
            code: 0,
            message: 'success',
            data: {
                inlines: {
                    // fk关系：皇冠历史记录 (一对多)
                    crown_history: {
                        fields: {
                            id: {
                                type: 'IntegerField' as const,
                                readonly: true,
                                show: true,
                                blank: false,
                                choices: [],
                                help_text: 'History record ID',
                                default: null,
                                name: 'ID'
                            },
                            event_type: {
                                type: 'CharField' as const,
                                readonly: false,
                                show: true,
                                blank: false,
                                choices: [
                                    ['created', 'Created'],
                                    ['transferred', 'Transferred'],
                                    ['maintenance', 'Maintenance'],
                                    ['sold', 'Sold']
                                ],
                                help_text: 'Type of historical event',
                                default: 'created',
                                name: 'Event Type'
                            },
                            description: {
                                type: 'TextField' as const,
                                readonly: false,
                                show: true,
                                blank: true,
                                choices: [],
                                help_text: 'Event description',
                                default: '',
                                name: 'Description'
                            },
                            event_date: {
                                type: 'DatetimeField' as const,
                                readonly: false,
                                show: true,
                                blank: false,
                                choices: [],
                                help_text: 'When the event occurred',
                                default: null,
                                name: 'Event Date'
                            }
                        },
                        actions: {},
                        attrs: {
                            help_text: 'Crown History Records',
                            can_search: true,
                            search_fields: ['event_type', 'description'],
                            can_add: true,
                            can_delete: true,
                            can_edit: true,
                            can_show_all: true,
                            list_per_page: 10,
                            list_search: [],
                            list_filter: ['event_type'],
                            list_sort: ['event_date'],
                            list_order: ['-event_date'],
                            max_num: 50,
                            min_num: 0
                        },
                        relation: {
                            to: 'crown',
                            source_field: 'crown_id',
                            dest_field: 'id',
                            relation: 'fk' as const
                        }
                    },
                    // fk关系：皇冠证书 (一对多)
                    crown_certificates: {
                        fields: {
                            id: {
                                type: 'IntegerField' as const,
                                readonly: true,
                                show: true,
                                blank: false,
                                choices: [],
                                help_text: 'Certificate ID',
                                default: null,
                                name: 'ID'
                            },
                            certificate_type: {
                                type: 'CharField' as const,
                                readonly: false,
                                show: true,
                                blank: false,
                                choices: [
                                    ['authenticity', 'Authenticity'],
                                    ['appraisal', 'Appraisal'],
                                    ['heritage', 'Heritage'],
                                    ['insurance', 'Insurance']
                                ],
                                help_text: 'Type of certificate',
                                default: 'authenticity',
                                name: 'Certificate Type'
                            },
                            issuer: {
                                type: 'CharField' as const,
                                readonly: false,
                                show: true,
                                blank: false,
                                choices: [],
                                help_text: 'Certificate issuing authority',
                                default: null,
                                name: 'Issuer'
                            },
                            certificate_number: {
                                type: 'CharField' as const,
                                readonly: false,
                                show: true,
                                blank: false,
                                choices: [],
                                help_text: 'Unique certificate number',
                                default: null,
                                name: 'Certificate Number'
                            },
                            status: {
                                type: 'CharField' as const,
                                readonly: false,
                                show: true,
                                blank: false,
                                choices: [
                                    ['active', 'Active'],
                                    ['expired', 'Expired'],
                                    ['revoked', 'Revoked']
                                ],
                                help_text: 'Certificate status',
                                default: 'active',
                                name: 'Status'
                            }
                        },
                        actions: {},
                        attrs: {
                            help_text: 'Crown Certificates',
                            can_search: true,
                            search_fields: ['certificate_type', 'issuer'],
                            can_add: true,
                            can_delete: true,
                            can_edit: true,
                            can_show_all: true,
                            list_per_page: 10,
                            list_search: [],
                            list_filter: ['certificate_type', 'status'],
                            list_sort: ['issue_date'],
                            list_order: ['-issue_date'],
                            max_num: 20,
                            min_num: 0
                        },
                        relation: {
                            to: 'crown',
                            source_field: 'crown_id',
                            dest_field: 'id',
                            relation: 'fk' as const
                        }
                    },
                    // o2o关系：皇冠保险 (一对一)
                    crown_insurance: {
                        fields: {
                            id: {
                                type: 'IntegerField' as const,
                                readonly: true,
                                show: true,
                                blank: false,
                                choices: [],
                                help_text: 'Insurance ID',
                                default: null,
                                name: 'ID'
                            },
                            policy_number: {
                                type: 'CharField' as const,
                                readonly: false,
                                show: true,
                                blank: false,
                                choices: [],
                                help_text: 'Insurance policy number',
                                default: null,
                                name: 'Policy Number'
                            },
                            insurance_company: {
                                type: 'CharField' as const,
                                readonly: false,
                                show: true,
                                blank: false,
                                choices: [],
                                help_text: 'Insurance company name',
                                default: null,
                                name: 'Insurance Company'
                            },
                            coverage_amount: {
                                type: 'FloatField' as const,
                                readonly: false,
                                show: true,
                                blank: false,
                                choices: [],
                                help_text: 'Insurance coverage amount',
                                default: null,
                                name: 'Coverage Amount'
                            },
                            policy_type: {
                                type: 'CharField' as const,
                                readonly: false,
                                show: true,
                                blank: false,
                                choices: [
                                    ['basic', 'Basic'],
                                    ['comprehensive', 'Comprehensive'],
                                    ['premium', 'Premium']
                                ],
                                help_text: 'Type of insurance policy',
                                default: 'basic',
                                name: 'Policy Type'
                            }
                        },
                        actions: {},
                        attrs: {
                            help_text: 'Crown Insurance',
                            can_search: true,
                            search_fields: ['policy_number', 'insurance_company'],
                            can_add: true,
                            can_delete: true,
                            can_edit: true,
                            can_show_all: true,
                            list_per_page: 10,
                            list_search: [],
                            list_filter: ['policy_type'],
                            list_sort: ['start_date'],
                            list_order: ['-start_date'],
                            max_num: 1,
                            min_num: 0
                        },
                        relation: {
                            to: 'crown',
                            source_field: 'crown_id',
                            dest_field: 'id',
                            relation: 'o2o' as const
                        }
                    },
                    // m2m关系：皇冠标签 (多对多)
                    crown_tags: {
                        fields: {
                            id: {
                                type: 'IntegerField' as const,
                                readonly: true,
                                show: true,
                                blank: false,
                                choices: [],
                                help_text: 'Tag ID',
                                default: null,
                                name: 'ID'
                            },
                            name: {
                                type: 'CharField' as const,
                                readonly: false,
                                show: true,
                                blank: false,
                                choices: [],
                                help_text: 'Tag name',
                                default: null,
                                name: 'Name'
                            },
                            description: {
                                type: 'TextField' as const,
                                readonly: false,
                                show: true,
                                blank: true,
                                choices: [],
                                help_text: 'Tag description',
                                default: null,
                                name: 'Description'
                            }
                        },
                        actions: {},
                        attrs: {
                            help_text: 'Crown Tags',
                            can_search: true,
                            search_fields: ['name', 'description'],
                            can_add: true,
                            can_delete: true,
                            can_edit: true,
                            can_show_all: true,
                            list_per_page: 10,
                            list_search: [],
                            list_filter: ['name'],
                            list_sort: ['name'],
                            list_order: ['name'],
                            max_num: 0,
                            min_num: 0
                        },
                        relation: {
                            to: 'crown',
                            source_field: 'crown_id',
                            dest_field: 'id',
                            relation: 'm2m' as const
                        }
                    }
                }
            }
        });
    }
};
