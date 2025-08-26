import type { Request, Response } from 'express';

const waitTime = (time: number = 100) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(true);
        }, time);
    });
};

// User model mock data
const userData = [
    {
        id: 1,
        username: 'admin',
        email: 'admin@example.com',
        first_name: 'System',
        last_name: 'Administrator',
        is_active: true,
        is_staff: true,
        department: 'IT',
        role: 'admin',
        created_at: '2024-01-01T00:00:00Z',
        last_login: '2024-01-15T10:30:00Z'
    },
    {
        id: 2,
        username: 'john_doe',
        email: 'john.doe@example.com',
        first_name: 'John',
        last_name: 'Doe',
        is_active: true,
        is_staff: false,
        department: 'Sales',
        role: 'user',
        created_at: '2024-01-02T09:15:00Z',
        last_login: '2024-01-14T16:45:00Z'
    },
    {
        id: 3,
        username: 'jane_smith',
        email: 'jane.smith@example.com',
        first_name: 'Jane',
        last_name: 'Smith',
        is_active: true,
        is_staff: true,
        department: 'HR',
        role: 'manager',
        created_at: '2024-01-03T14:20:00Z',
        last_login: '2024-01-13T11:10:00Z'
    },
    {
        id: 4,
        username: 'bob_wilson',
        email: 'bob.wilson@example.com',
        first_name: 'Bob',
        last_name: 'Wilson',
        is_active: false,
        is_staff: false,
        department: 'Finance',
        role: 'user',
        created_at: '2024-01-04T08:30:00Z',
        last_login: '2024-01-10T17:15:00Z'
    }
];

// Crown model mock data
const crownData = [
    {
        id: 1,
        name: 'Golden Crown',
        type: 'gold',
        level: 5,
        price: 9999.99,
        is_active: true,
        created_at: '2024-01-15T10:30:00Z',
        updated_at: '2024-01-20T14:20:00Z',
        rich_description: '{"time":1703097600000,"blocks":[{"id":"heading","type":"header","data":{"text":"Golden Crown of Arthur","level":2}},{"id":"intro","type":"paragraph","data":{"text":"This magnificent <strong>Golden Crown of Arthur</strong> represents the pinnacle of medieval craftsmanship."}},{"id":"features-header","type":"header","data":{"text":"Features:","level":3}},{"id":"features-list","type":"list","data":{"style":"unordered","items":["Crafted from <mark>24-karat pure gold</mark>","Adorned with precious gems: <em>diamonds, rubies, emeralds</em>","Historical significance dating back to <u>6th century</u>","Weight: <code>2.5 kg</code>"]}},{"id":"quote","type":"quote","data":{"text":"A truly <em>legendary</em> piece of royal heritage that has witnessed countless coronations.","caption":"Royal Heritage Museum"}},{"id":"note","type":"paragraph","data":{"text":"<strong>Note:</strong> This crown is currently on display at the Royal Museum."}}],"version":"2.28.2"}',
        image_url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop',
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
        is_active: true,
        created_at: '2024-01-16T09:15:00Z',
        updated_at: '2024-01-22T16:45:00Z',
        rich_description: '{"time":1703184000000,"blocks":[{"id":"title","type":"header","data":{"text":"Diamond Crown Excellence","level":2}},{"id":"intro","type":"paragraph","data":{"text":"Exquisite <strong>Diamond Crown</strong> featuring <mark>99 flawless diamonds</mark>."}},{"id":"quote","type":"quote","data":{"text":"A masterpiece of modern royal jewelry design that captures light like no other.","caption":"Chief Designer, Royal Jewelers"}},{"id":"specs-header","type":"header","data":{"text":"Technical Specifications:","level":3}},{"id":"specs-list","type":"list","data":{"style":"ordered","items":["<strong>Diamonds:</strong> 99 premium cut stones","<strong>Setting:</strong> Platinum framework","<strong>Weight:</strong> 1.8 kg","<strong>Design:</strong> Contemporary minimalist approach"]}},{"id":"usage","type":"paragraph","data":{"text":"Perfect for <u>ceremonial occasions</u> and <u>state functions</u>."}}],"version":"2.28.2"}',
        image_url: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400&h=300&fit=crop',
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

// Crown tag relations data (中间表数据)
const crownTagRelationsData = [
    {
        id: 1,
        crown_id: 1,
        tag_id: 1,  // Crown 1 has luxury tag
        created_at: '2024-01-01T00:00:00Z'
    },
    {
        id: 2,
        crown_id: 1,
        tag_id: 3,  // Crown 1 has royal tag
        created_at: '2024-01-01T00:00:00Z'
    },
    {
        id: 3,
        crown_id: 2,
        tag_id: 2,  // Crown 2 has antique tag
        created_at: '2024-01-01T00:00:00Z'
    },
    {
        id: 4,
        crown_id: 2,
        tag_id: 4,  // Crown 2 has ceremonial tag
        created_at: '2024-01-01T00:00:00Z'
    },
    {
        id: 5,
        crown_id: 3,
        tag_id: 5,  // Crown 3 has decorative tag
        created_at: '2024-01-01T00:00:00Z'
    }
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
        rich_description: {
            type: 'EditorField' as const,
            readonly: false,
            show: true,
            blank: true,
            choices: [],
            help_text: 'Detailed description with rich text formatting',
            default: '',
            name: 'Rich Description'
        },
        image_url: {
            type: 'ImageField' as const,
            readonly: false,
            show: true,
            blank: true,
            choices: [],
            help_text: 'Crown image URL for display',
            default: '',
            name: 'Crown Image'
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
        // Empty input + Toast output - 直接执行并显示消息
        activate: {
            name: 'activate',
            label: 'Activate Crowns',
            output: 'toast',
            input: 'empty',
            confirm: true,
            description: 'Activate selected crowns',
            batch: true,
            extra: {}
        },
        deactivate: {
            name: 'deactivate',
            label: 'Deactivate Crowns',
            output: 'toast',
            input: 'empty',
            confirm: true,
            description: 'Deactivate selected crowns',
            batch: true,
            extra: {}
        },

        // Display output action - 显示表格数据
        view_details: {
            name: 'view_details',
            label: 'View Details',
            output: 'display',
            input: 'empty',
            confirm: false,
            description: 'View detailed information',
            batch: false,
            extra: {}
        },

        // String input + Toast output - 需要输入内容
        add_note: {
            name: 'add_note',
            label: 'Add Note',
            output: 'toast',
            input: 'string',
            confirm: false,
            description: 'Add a maintenance note to selected crowns',
            batch: false,
            extra: {}
        },
        set_owner: {
            name: 'set_owner',
            label: 'Change Owner',
            output: 'refresh',
            input: 'string',
            confirm: true,
            description: 'Change the owner of selected crowns',
            batch: true,
            extra: {}
        },

        // File input + Toast output - 需要上传文件
        upload_certificate: {
            name: 'upload_certificate',
            label: 'Upload Certificate',
            output: 'toast',
            input: 'file',
            confirm: false,
            description: 'Upload authenticity certificate for this crown',
            batch: false,
            extra: {}
        },

        // Empty input + Download output - 生成并下载文件
        export_excel: {
            name: 'export_excel',
            label: 'Export to Excel',
            output: 'download',
            input: 'empty',
            confirm: false,
            description: 'Export selected crowns data to Excel file',
            batch: true,
            extra: {}
        },
        export_pdf: {
            name: 'export_pdf',
            label: 'Export Report',
            output: 'download',
            input: 'string',
            confirm: false,
            description: 'Generate and download detailed report',
            batch: true,
            extra: {}
        },

        // Empty input + Table output - 显示分析结果
        analyze_value: {
            name: 'analyze_value',
            label: 'Value Analysis',
            output: 'display',
            input: 'empty',
            confirm: false,
            description: 'Analyze the market value of selected crowns',
            batch: true,
            extra: {}
        },

        // File input + Table output - 上传文件并显示分析结果
        upload_and_analyze: {
            name: 'upload_and_analyze',
            label: 'Upload & Analyze',
            output: 'display',
            input: 'file',
            confirm: false,
            description: 'Upload appraisal documents and get analysis results',
            batch: false,
            extra: {}
        },

        // Empty input + Refresh output - 执行后刷新页面
        recalculate_stats: {
            name: 'recalculate_stats',
            label: 'Recalculate Statistics',
            output: 'refresh',
            input: 'empty',
            confirm: true,
            description: 'Recalculate all crown statistics and market values',
            batch: true,
            extra: {}
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
        editable: true,
        list_per_page: 20,
        list_search: ['name', 'type', 'owner', 'status'],
        list_filter: ['type', 'level', 'material', 'region', 'status', 'is_active'],
        list_sort: ['id', 'name', 'price', 'level', 'created_at', 'updated_at'],
        list_order: ['-created_at'],
        detail_display: ['id', 'name', 'type', 'level', 'price', 'description', 'owner', 'weight', 'material', 'region', 'status', 'is_active', 'created_at', 'updated_at']
    }
};

// User model description with comprehensive actions
const userModelDesc = {
    fields: {
        id: {
            type: 'IntegerField' as const,
            readonly: true,
            show: true,
            blank: false,
            choices: [],
            help_text: 'User ID',
            default: null,
            name: 'ID'
        },
        username: {
            type: 'CharField' as const,
            readonly: false,
            show: true,
            blank: false,
            choices: [],
            help_text: 'Username',
            default: null,
            name: 'Username'
        },
        email: {
            type: 'CharField' as const,
            readonly: false,
            show: true,
            blank: false,
            choices: [],
            help_text: 'Email address',
            default: null,
            name: 'Email'
        },
        first_name: {
            type: 'CharField' as const,
            readonly: false,
            show: true,
            blank: true,
            choices: [],
            help_text: 'First name',
            default: null,
            name: 'First Name'
        },
        last_name: {
            type: 'CharField' as const,
            readonly: false,
            show: true,
            blank: true,
            choices: [],
            help_text: 'Last name',
            default: null,
            name: 'Last Name'
        },
        is_active: {
            type: 'BooleanField' as const,
            readonly: false,
            show: true,
            blank: false,
            choices: [],
            help_text: 'Active status',
            default: true,
            name: 'Active'
        },
        is_staff: {
            type: 'BooleanField' as const,
            readonly: false,
            show: true,
            blank: false,
            choices: [],
            help_text: 'Staff status',
            default: false,
            name: 'Staff'
        },
        department: {
            type: 'CharField' as const,
            readonly: false,
            show: true,
            blank: true,
            choices: [
                ['IT', 'Information Technology'],
                ['HR', 'Human Resources'],
                ['Sales', 'Sales'],
                ['Finance', 'Finance']
            ],
            help_text: 'Department',
            default: null,
            name: 'Department'
        },
        role: {
            type: 'CharField' as const,
            readonly: false,
            show: true,
            blank: false,
            choices: [
                ['admin', 'Administrator'],
                ['manager', 'Manager'],
                ['user', 'Regular User']
            ],
            help_text: 'User role',
            default: 'user',
            name: 'Role'
        }
    },
    actions: {
        // String input + Toast output
        send_message: {
            name: 'send_message',
            label: 'Send Message',
            output: 'toast',
            input: 'string',
            confirm: false,
            description: 'Send a message to selected users',
            batch: true,
            extra: {}
        },

        // File input + Toast output
        upload_avatar: {
            name: 'upload_avatar',
            label: 'Upload Avatar',
            output: 'toast',
            input: 'file',
            confirm: false,
            description: 'Upload profile picture',
            batch: false,
            extra: {}
        },

        // Empty input + Download output
        export_users: {
            name: 'export_users',
            label: 'Export Users',
            output: 'download',
            input: 'empty',
            confirm: false,
            description: 'Export user data to Excel',
            batch: true,
            extra: {}
        },

        // String input + Download output
        generate_report: {
            name: 'generate_report',
            label: 'Generate Report',
            output: 'download',
            input: 'string',
            confirm: false,
            description: 'Generate custom user report',
            batch: true,
            extra: {}
        },

        // Empty input + Table output
        analyze_users: {
            name: 'analyze_users',
            label: 'Analyze Users',
            output: 'display',
            input: 'empty',
            confirm: false,
            description: 'Analyze user statistics',
            batch: true,
            extra: {}
        },

        // File input + Table output
        import_analysis: {
            name: 'import_analysis',
            label: 'Import & Analyze',
            output: 'display',
            input: 'file',
            confirm: false,
            description: 'Import and analyze user data',
            batch: true,
            extra: {}
        },

        // Empty input + Refresh output
        reset_passwords: {
            name: 'reset_passwords',
            label: 'Reset Passwords',
            output: 'refresh',
            input: 'empty',
            confirm: true,
            description: 'Reset user passwords',
            batch: true,
            extra: {}
        },

        // String input + Refresh output
        change_department: {
            name: 'change_department',
            label: 'Change Department',
            output: 'refresh',
            input: 'string',
            confirm: true,
            description: 'Change user department',
            batch: true,
            extra: {}
        }
    },
    attrs: {
        help_text: 'User Management - Complete action examples',
        can_search: true,
        search_fields: ['username', 'email', 'first_name', 'last_name'],
        can_add: true,
        can_delete: true,
        can_edit: true,
        can_show_all: true,
        editable: true,
        list_per_page: 20,
        list_search: ['username', 'email'],
        list_filter: ['is_active', 'is_staff', 'department', 'role'],
        list_sort: ['id', 'username', 'created_at'],
        list_order: ['-id'],
        detail_display: ['id', 'username', 'email', 'first_name', 'last_name', 'is_active', 'is_staff', 'department', 'role']
    }
};

// Crown actions处理函数
const handleCrownActions = async (req: Request, res: Response, action: string, form_data: any, input_data: any, search_condition: any[]) => {
    // 模拟根据条件计算影响的记录数
    const getAffectedCount = () => {
        if (!search_condition || search_condition.length === 0) return crownData.length;

        // 简单模拟：根据条件类型返回不同数量
        const hasIdCondition = search_condition.some((c: any) => c.field === 'id');
        if (hasIdCondition) return 1;

        // 其他条件模拟返回部分记录
        return Math.floor(crownData.length * 0.3);
    };

    const affectedCount = getAffectedCount();

    // 根据不同action返回不同类型的响应
    let result;
    let responseMessage = 'success';

    switch (action) {
        // Toast output actions
        case 'activate':
            responseMessage = `Successfully activated ${affectedCount} crown(s)`;
            result = { affected: affectedCount };
            break;

        case 'deactivate':
            responseMessage = `Successfully deactivated ${affectedCount} crown(s)`;
            result = { affected: affectedCount };
            break;

        case 'add_note':
            const note = input_data?.note || form_data?.note || 'No note provided';
            responseMessage = `Added note "${note}" to ${affectedCount} crown(s)`;
            result = { affected: affectedCount, note };
            break;

        case 'view_details':
            responseMessage = 'Details retrieved successfully';
            result = [
                {
                    id: 1,
                    property: 'Name',
                    value: 'Golden Crown',
                    type: 'string'
                },
                {
                    id: 2,
                    property: 'Material',
                    value: 'Gold & Diamonds',
                    type: 'string'
                },
                {
                    id: 3,
                    property: 'Weight',
                    value: '2.5kg',
                    type: 'number'
                },
                {
                    id: 4,
                    property: 'Status',
                    value: 'Active',
                    type: 'status'
                },
                {
                    id: 5,
                    property: 'Last Updated',
                    value: '2024-01-15',
                    type: 'date'
                }
            ];
            break;

        case 'upload_certificate':
            const files = input_data?.files || form_data?.files || [];
            responseMessage = `Successfully uploaded ${files.length} certificate file(s) for ${affectedCount} crown(s)`;
            result = { affected: affectedCount, uploaded_files: files.length };
            break;

        // Refresh output actions
        case 'set_owner':
            const newOwner = input_data?.owner || form_data?.owner || 'Unknown Owner';
            responseMessage = `Changed owner to "${newOwner}" for ${affectedCount} crown(s)`;
            result = { affected: affectedCount, new_owner: newOwner };
            break;

        case 'recalculate_stats':
            responseMessage = `Recalculated statistics for ${affectedCount} crown(s)`;
            result = {
                affected: affectedCount,
                statistics: {
                    total_value: 1250000.00,
                    average_price: 15625.00,
                    highest_value: 35000.00,
                    lowest_value: 999.99
                }
            };
            break;

        // Download output actions
        case 'export_excel':
            responseMessage = 'Excel export file generated successfully';
            result = {
                affected: affectedCount,
                url: '/api/download/crown_export.xlsx',
                filename: `crown_export_${new Date().getTime()}.xlsx`,
                contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            };
            break;

        case 'export_pdf':
            const reportTitle = input_data?.title || form_data?.title || 'Crown Report';
            responseMessage = 'PDF report generated successfully';
            result = {
                affected: affectedCount,
                url: '/api/download/crown_report.pdf',
                filename: `crown_report_${new Date().getTime()}.pdf`,
                contentType: 'application/pdf',
                report_title: reportTitle
            };
            break;

        // Table output actions
        case 'analyze_value':
            responseMessage = 'Value analysis completed';
            result = [
                {
                    id: 1,
                    crown_name: 'Golden Crown',
                    current_value: 9999.99,
                    market_estimate: 12500.00,
                    appreciation: '+25.0%',
                    risk_level: 'Low',
                    recommendation: 'Hold'
                },
                {
                    id: 2,
                    crown_name: 'Diamond Crown',
                    current_value: 19999.99,
                    market_estimate: 22000.00,
                    appreciation: '+10.0%',
                    risk_level: 'Medium',
                    recommendation: 'Buy'
                },
                {
                    id: 3,
                    crown_name: 'Jade Crown',
                    current_value: 8888.88,
                    market_estimate: 9500.00,
                    appreciation: '+6.9%',
                    risk_level: 'Low',
                    recommendation: 'Hold'
                },
                {
                    id: 4,
                    crown_name: 'Ruby Crown',
                    current_value: 15555.55,
                    market_estimate: 14000.00,
                    appreciation: '-10.0%',
                    risk_level: 'High',
                    recommendation: 'Sell'
                },
                {
                    id: 5,
                    crown_name: 'Platinum Crown',
                    current_value: 25999.99,
                    market_estimate: 28000.00,
                    appreciation: '+7.7%',
                    risk_level: 'Medium',
                    recommendation: 'Hold'
                }
            ];
            break;

        case 'upload_and_analyze':
            const uploadedFiles = input_data?.files || form_data?.files || [];
            responseMessage = `Analyzed ${uploadedFiles.length} appraisal document(s)`;
            result = [
                {
                    document_name: uploadedFiles[0]?.name || 'Unknown Document',
                    analysis_result: 'Authentic',
                    confidence: '94%',
                    estimated_value: 18500.00,
                    appraisal_date: '2024-01-15',
                    notes: 'High quality gemstones, excellent condition'
                },
                {
                    document_name: uploadedFiles[1]?.name || 'Secondary Analysis',
                    analysis_result: 'Verified',
                    confidence: '89%',
                    estimated_value: 17800.00,
                    appraisal_date: '2024-01-14',
                    notes: 'Minor wear consistent with age'
                }
            ];
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
        message: responseMessage,
        data: result
    });
};

// Crown History actions处理函数
const handleCrownHistoryActions = async (req: Request, res: Response, action: string, form_data: any, input_data: any, search_condition: any[]) => {
    // 模拟根据条件计算影响的记录数
    const getAffectedCount = () => {
        if (!search_condition || search_condition.length === 0) return crownHistoryData.length;

        // 简单模拟：根据条件类型返回不同数量
        const hasIdCondition = search_condition.some((c: any) => c.field === 'id');
        if (hasIdCondition) return 1;

        // 其他条件模拟返回部分记录
        return Math.floor(crownHistoryData.length * 0.4);
    };

    const affectedCount = getAffectedCount();

    // 根据不同action返回不同类型的响应
    let result;
    let responseMessage = 'success';

    switch (action) {
        // 批量操作
        case 'export_history':
            responseMessage = `Successfully exported ${affectedCount} history record(s)`;
            result = {
                download: {
                    url: '/api/download/crown_history_export.xlsx',
                    filename: `crown_history_${new Date().getTime()}.xlsx`,
                    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                }
            };
            break;

        case 'mark_verified':
            responseMessage = `Successfully marked ${affectedCount} history record(s) as verified`;
            result = { affected: affectedCount, verified_at: new Date().toISOString() };
            break;

        case 'bulk_delete':
            responseMessage = `Successfully deleted ${affectedCount} history record(s)`;
            result = { affected: affectedCount, deleted_count: affectedCount };
            break;

        // 单条记录操作
        case 'view_details':
            responseMessage = 'History details retrieved successfully';
            result = [
                {
                    id: 1,
                    property: 'Event Type',
                    value: 'Created',
                    type: 'string'
                },
                {
                    id: 2,
                    property: 'Event Date',
                    value: '2024-01-15 10:30:00',
                    type: 'datetime'
                },
                {
                    id: 3,
                    property: 'Description',
                    value: 'Crown was initially created and catalogued',
                    type: 'text'
                },
                {
                    id: 4,
                    property: 'Verification Status',
                    value: 'Verified',
                    type: 'status'
                },
                {
                    id: 5,
                    property: 'Location',
                    value: 'Royal Treasury',
                    type: 'string'
                }
            ];
            break;

        case 'add_note':
            const note = input_data?.note || form_data?.note || 'No note provided';
            responseMessage = `Added note "${note}" to history record`;
            result = { affected: 1, note, added_at: new Date().toISOString() };
            break;

        case 'upload_evidence':
            const files = input_data?.files || form_data?.files || [];
            responseMessage = `Successfully uploaded ${files.length} evidence file(s) for history record`;
            result = { affected: 1, uploaded_files: files.length, files_info: files };
            break;

        case 'generate_report':
            responseMessage = 'History report generated successfully';
            result = {
                download: {
                    url: '/api/download/history_report.pdf',
                    filename: `history_report_${new Date().getTime()}.pdf`,
                    contentType: 'application/pdf',
                    report_title: 'Crown History Detailed Report'
                }
            };
            break;

        case 'duplicate_event':
            responseMessage = 'History event duplicated successfully';
            result = {
                affected: 1,
                new_record_id: Math.floor(Math.random() * 1000) + 100,
                duplicated_at: new Date().toISOString()
            };
            break;

        default:
            responseMessage = `Unknown action: ${action}`;
            result = null;
            res.send({
                code: 1,
                message: responseMessage,
                data: result
            });
            return;
    }

    res.send({
        code: 0,
        message: responseMessage,
        data: result
    });
};

// Tools actions处理函数
const handleToolsActions = async (req: Request, res: Response, action: string, form_data: any, input_data: any, search_condition: any[]) => {
    let responseMessage = '';
    let result: any = null;

    switch (action) {
        case 'preview':
            responseMessage = 'Report preview generated successfully';
            result = {
                preview_data: {
                    title: `${form_data?.report_type || input_data?.report_type || 'Daily'} Crown Management Report`,
                    date_range: `${form_data?.start_date || input_data?.start_date || '2024-01-01'} to ${form_data?.end_date || input_data?.end_date || '2024-01-31'}`,
                    summary: {
                        total_crowns: 156,
                        active_crowns: 142,
                        pending_transfers: 8,
                        maintenance_required: 6
                    },
                    preview_content: [
                        'Executive Summary',
                        'Crown Inventory Status',
                        'Recent Activities',
                        'Security Reports',
                        'Recommendations'
                    ]
                }
            };
            break;

        case 'generate':
            responseMessage = 'Report generated and ready for download';
            const reportType = form_data?.report_type || input_data?.report_type || 'daily';
            const exportFormat = form_data?.export_format || input_data?.export_format || 'pdf';
            result = {
                download: {
                    url: `/api/download/crown_report_${reportType}_${new Date().getTime()}.${exportFormat}`,
                    filename: `crown_report_${reportType}_${new Date().toISOString().split('T')[0]}.${exportFormat}`,
                    contentType: exportFormat === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' :
                        exportFormat === 'csv' ? 'text/csv' : 'application/pdf',
                    size: Math.floor(Math.random() * 5000) + 1000, // Random size in KB
                    generated_at: new Date().toISOString()
                }
            };
            break;

        case 'send_email':
            const recipients = form_data?.email_recipients || input_data?.email_recipients || 'admin@example.com';
            const recipientList = recipients.split(',').map((email: string) => email.trim()).filter(Boolean);
            responseMessage = `Report successfully sent to ${recipientList.length} recipient(s)`;
            result = {
                email_sent: true,
                recipients: recipientList,
                sent_at: new Date().toISOString(),
                email_id: `EMAIL_${new Date().getTime()}`,
                report_type: form_data?.report_type || input_data?.report_type || 'daily'
            };
            break;

        case 'schedule':
            responseMessage = 'Report scheduling configured successfully';
            const emailRecipients = form_data?.email_recipients || input_data?.email_recipients;
            result = {
                scheduled: true,
                schedule_id: `SCHEDULE_${new Date().getTime()}`,
                report_type: form_data?.report_type || input_data?.report_type || 'daily',
                frequency: form_data?.frequency || input_data?.frequency || 'daily',
                next_run: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
                recipients: emailRecipients ? emailRecipients.split(',').map((email: string) => email.trim()) : ['admin@example.com'],
                export_format: form_data?.export_format || input_data?.export_format || 'pdf',
                include_details: form_data?.include_details || input_data?.include_details || false
            };
            break;

        default:
            responseMessage = `Unknown action: ${action}`;
            result = null;
            res.send({
                code: 1,
                message: responseMessage,
                data: result
            });
            return;
    }

    res.send({
        code: 0,
        message: responseMessage,
        data: result
    });
};


export default {
    // 获取模型描述
    'POST /api/admin/model-desc': async (req: Request, res: Response) => {
        const { name } = req.body;
        await waitTime(500);

        if (name === 'crown') {
            res.send({
                code: 0,
                message: 'success',
                data: crownModelDesc
            });
        } else if (name === 'user') {
            res.send({
                code: 0,
                message: 'success',
                data: userModelDesc
            });
        } else if (name === 'tools') {
            // AdminToolSerializeModel mock data
            res.send({
                code: 0,
                message: 'success',
                data: {
                    fields: {
                        report_type: {
                            type: 'CharField' as const,
                            readonly: false,
                            show: true,
                            blank: false,
                            choices: [
                                ['daily', 'Daily Report'],
                                ['weekly', 'Weekly Report'],
                                ['monthly', 'Monthly Report'],
                                ['yearly', 'Yearly Report']
                            ],
                            help_text: 'Select the type of report to generate',
                            default: 'daily',
                            name: 'Report Type'
                        },
                        start_date: {
                            type: 'DateField' as const,
                            readonly: false,
                            show: true,
                            blank: false,
                            choices: [],
                            help_text: 'Start date for the report period',
                            default: null,
                            name: 'Start Date'
                        },
                        end_date: {
                            type: 'DateField' as const,
                            readonly: false,
                            show: true,
                            blank: false,
                            choices: [],
                            help_text: 'End date for the report period',
                            default: null,
                            name: 'End Date'
                        },
                        include_details: {
                            type: 'BooleanField' as const,
                            readonly: false,
                            show: true,
                            blank: true,
                            choices: [],
                            help_text: 'Include detailed breakdown in the report',
                            default: false,
                            name: 'Include Details'
                        },
                        export_format: {
                            type: 'CharField' as const,
                            readonly: false,
                            show: true,
                            blank: false,
                            choices: [
                                ['pdf', 'PDF'],
                                ['excel', 'Excel'],
                                ['csv', 'CSV']
                            ],
                            help_text: 'Choose the format for exporting the report',
                            default: 'pdf',
                            name: 'Export Format'
                        },
                        email_recipients: {
                            type: 'TextField' as const,
                            readonly: false,
                            show: true,
                            blank: true,
                            choices: [],
                            help_text: 'Email addresses to send the report (comma-separated)',
                            default: '',
                            name: 'Email Recipients'
                        }
                    },
                    actions: {
                        preview: {
                            name: 'preview',
                            label: 'Preview Report',
                            output: 'display' as const,
                            input: 'empty' as const,
                            confirm: false,
                            description: 'Preview the report before generating',
                            batch: false,
                            extra: {}
                        },
                        generate: {
                            name: 'generate',
                            label: 'Generate Report',
                            output: 'download' as const,
                            input: 'string' as const,
                            confirm: true,
                            description: 'Generate and download the report',
                            batch: false,
                            extra: {}
                        },
                        send_email: {
                            name: 'send_email',
                            label: 'Send via Email',
                            output: 'toast' as const,
                            input: 'string' as const,
                            confirm: true,
                            description: 'Generate report and send via email',
                            batch: false,
                            extra: {}
                        },
                        schedule: {
                            name: 'schedule',
                            label: 'Schedule Report',
                            output: 'toast' as const,
                            input: 'string' as const,
                            confirm: false,
                            description: 'Schedule this report for automatic generation',
                            batch: false,
                            extra: {}
                        }
                    },
                    attrs: {
                        help_text: 'Crown Management Reporting Tools',
                        output_field: 'report_data'
                    }
                }
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

    // 获取模型数据
    'POST /api/admin/model-data': async (req: Request, res: Response) => {
        const { name, page = 1, size = 20, cond = [] } = req.body;
        await waitTime(300);

        let filteredData: any[] = [];

        if (name === 'crown') {
            filteredData = [...crownData];
        } else if (name === 'user') {
            filteredData = [...userData];
        } else if (name === 'crown_history') {
            filteredData = [...crownHistoryData];
        } else if (name === 'crown_tags') {
            filteredData = [...crownTagsData];
        } else if (name === 'crown_tag_relations') {
            filteredData = [...crownTagRelationsData];
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

    // 模型操作
    'POST /api/admin/model-action': async (req: Request, res: Response) => {
        const { name, action, search_condition = [], form_data = {}, input_data = {} } = req.body;
        await waitTime(800);

        if (name === 'crown') {
            return handleCrownActions(req, res, action, form_data, input_data, search_condition);
        } else if (name === 'crown_history') {
            return handleCrownHistoryActions(req, res, action, form_data, input_data, search_condition);
        } else if (name === 'tools') {
            return handleToolsActions(req, res, action, form_data, input_data, search_condition);
        } else {
            res.send({
                code: 1,
                message: `Model ${name} not found`,
                data: null
            });
            return;
        }
    },

    // Crown 模型删除
    'POST /api/admin/model-delete': async (req: Request, res: Response) => {
        const { name, data } = req.body;
        await waitTime(600);

        if (name === 'crown') {
            const deletedCount = Array.isArray(data) ? data.length : 1;

            res.send({
                code: 0,
                message: 'success',
                data: {
                    message: `Successfully deleted ${deletedCount} crown record(s)`,
                    deleted_count: deletedCount
                }
            });
        } else if (name === 'crown_history') {
            const deletedCount = Array.isArray(data) ? data.length : 1;

            // 模拟从数据源删除记录
            if (Array.isArray(data)) {
                data.forEach((record: any) => {
                    const index = crownHistoryData.findIndex(item => item.id === record.id);
                    if (index > -1) {
                        crownHistoryData.splice(index, 1);
                    }
                });
            } else {
                const index = crownHistoryData.findIndex(item => item.id === data.id);
                if (index > -1) {
                    crownHistoryData.splice(index, 1);
                }
            }

            res.send({
                code: 0,
                message: 'success',
                data: {
                    message: `Successfully deleted ${deletedCount} crown history record(s)`,
                    deleted_count: deletedCount
                }
            });
        } else if (name === 'crown_tag_relations') {
            // Crown tag relations 删除操作 (M2M 中间表)
            const deletedCount = Array.isArray(data) ? data.length : 1;

            // 模拟从数据源删除记录
            if (Array.isArray(data)) {
                data.forEach((record: any) => {
                    const index = crownTagRelationsData.findIndex(item => item.id === record.id);
                    if (index > -1) {
                        crownTagRelationsData.splice(index, 1);
                    }
                });
            } else {
                const index = crownTagRelationsData.findIndex(item => item.id === data.id);
                if (index > -1) {
                    crownTagRelationsData.splice(index, 1);
                }
            }

            res.send({
                code: 0,
                message: 'success',
                data: {
                    message: `Successfully deleted ${deletedCount} crown tag relation(s)`,
                    deleted_count: deletedCount
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

    // Crown 模型保存
    'POST /api/admin/model-save': async (req: Request, res: Response) => {
        const { name, data, inlines } = req.body;
        await waitTime(800);

        if (name === 'crown') {
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
        } else if (name === 'crown_history') {
            // Crown History 保存操作
            const isUpdate = data.id;
            let savedData;

            if (isUpdate) {
                // 更新现有记录
                const index = crownHistoryData.findIndex(item => item.id === data.id);
                if (index > -1) {
                    savedData = {
                        ...crownHistoryData[index],
                        ...data,
                        updated_at: new Date().toISOString()
                    };
                    crownHistoryData[index] = savedData;
                } else {
                    savedData = {
                        ...data,
                        updated_at: new Date().toISOString()
                    };
                }
            } else {
                // 创建新记录
                savedData = {
                    ...data,
                    id: Math.max(...crownHistoryData.map(item => item.id)) + 1,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };
                crownHistoryData.push(savedData);
            }

            res.send({
                code: 0,
                message: 'success',
                data: {
                    message: isUpdate ? 'Crown history record updated successfully' : 'New crown history record created successfully',
                    saved_data: savedData,
                    is_update: isUpdate
                }
            });
        } else if (name === 'crown_tag_relations') {
            // Crown tag relations 保存操作 (M2M 中间表)
            const newRecord = {
                ...data,
                id: Date.now(),
                created_at: new Date().toISOString()
            };
            crownTagRelationsData.push(newRecord);

            res.send({
                code: 0,
                message: 'success',
                data: {
                    message: 'Crown tag relation saved successfully',
                    saved_data: newRecord
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

    // Crown 模型内联信息
    'POST /api/admin/model-inlines': async (req: Request, res: Response) => {
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
        // 模拟返回内联模型信息
        res.send({
            code: 0,
            message: 'success',
            data: {
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
                                ['sold', 'Sold'],
                                ['reserved', 'Reserved'],
                                ['appraised', 'Appraised'],
                                ['inspection', 'Inspection'],
                                ['exhibition', 'Exhibition']
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
                    actions: {
                        // 批量操作
                        export_history: {
                            name: 'export_history',
                            label: 'Export History',
                            help_text: 'Export selected history records to Excel',
                            batch: true,
                            input: 'empty',
                            output: 'download'
                        },
                        mark_verified: {
                            name: 'mark_verified',
                            label: 'Mark as Verified',
                            help_text: 'Mark selected history records as verified',
                            batch: true,
                            input: 'empty',
                            output: 'toast'
                        },
                        bulk_delete: {
                            name: 'bulk_delete',
                            label: 'Bulk Delete',
                            help_text: 'Delete multiple history records at once',
                            batch: true,
                            input: 'empty',
                            output: 'refresh'
                        },
                        // 单条记录操作
                        view_details: {
                            name: 'view_details',
                            label: 'View Details',
                            help_text: 'View detailed information about this history record',
                            batch: false,
                            input: 'empty',
                            output: 'display'
                        },
                        add_note: {
                            name: 'add_note',
                            label: 'Add Note',
                            help_text: 'Add a note to this history record',
                            batch: false,
                            input: 'string',
                            output: 'toast'
                        },
                        upload_evidence: {
                            name: 'upload_evidence',
                            label: 'Upload Evidence',
                            help_text: 'Upload supporting documents for this event',
                            batch: false,
                            input: 'file',
                            output: 'toast'
                        },
                        generate_report: {
                            name: 'generate_report',
                            label: 'Generate Report',
                            help_text: 'Generate a detailed report for this history event',
                            batch: false,
                            input: 'empty',
                            output: 'download'
                        },
                        duplicate_event: {
                            name: 'duplicate_event',
                            label: 'Duplicate Event',
                            help_text: 'Create a copy of this history event with current date',
                            batch: false,
                            input: 'empty',
                            output: 'refresh'
                        }
                    },
                    attrs: {
                        help_text: 'Crown History Records',
                        can_search: true,
                        search_fields: ['event_type', 'description'],
                        can_add: true,
                        can_delete: true,
                        can_edit: true,
                        can_show_all: true,
                        list_per_page: 10,
                        list_search: ['id', 'description'],
                        list_filter: ['event_type'],
                        list_sort: ['event_date'],
                        list_order: ['-event_date'],
                        max_num: 50,
                        min_num: 0
                    },
                    relation: {
                        to: 'crown_history',
                        source_field: 'id',
                        dest_field: 'crown_id',
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
                        issue_date: {
                            type: 'DatetimeField' as const,
                            readonly: false,
                            show: true,
                            blank: false,
                            choices: [],
                            help_text: 'Certificate issue date',
                            default: null,
                            name: 'Issue Date'
                        },
                        expiry_date: {
                            type: 'DatetimeField' as const,
                            readonly: false,
                            show: true,
                            blank: true,
                            choices: [],
                            help_text: 'Certificate expiry date',
                            default: null,
                            name: 'Expiry Date'
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
                        to: 'crown_certificates',
                        source_field: 'id',
                        dest_field: 'crown_id',
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
                        premium_amount: {
                            type: 'FloatField' as const,
                            readonly: false,
                            show: true,
                            blank: false,
                            choices: [],
                            help_text: 'Insurance premium amount',
                            default: null,
                            name: 'Premium Amount'
                        },
                        start_date: {
                            type: 'DatetimeField' as const,
                            readonly: false,
                            show: true,
                            blank: false,
                            choices: [],
                            help_text: 'Policy start date',
                            default: null,
                            name: 'Start Date'
                        },
                        end_date: {
                            type: 'DatetimeField' as const,
                            readonly: false,
                            show: true,
                            blank: false,
                            choices: [],
                            help_text: 'Policy end date',
                            default: null,
                            name: 'End Date'
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
                        },
                        status: {
                            type: 'CharField' as const,
                            readonly: false,
                            show: true,
                            blank: false,
                            choices: [
                                ['active', 'Active'],
                                ['expired', 'Expired'],
                                ['cancelled', 'Cancelled'],
                                ['pending', 'Pending']
                            ],
                            help_text: 'Insurance policy status',
                            default: 'active',
                            name: 'Status'
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
                        to: 'crown_insurance',
                        source_field: 'id',
                        dest_field: 'crown_id',
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
                        to: 'crown_tags',
                        source_field: 'id',
                        dest_field: 'id',
                        relation: 'm2m' as const,
                        through: {
                            mid_model: 'crown_tag_relations',
                            source_field: 'id',
                            source_to_through_field: 'crown_id',
                            target_field: 'id',
                            target_to_through_field: 'tag_id'
                        }
                    }
                }
            }
        });
    }
};
