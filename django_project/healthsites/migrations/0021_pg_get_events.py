# -*- coding: utf-8 -*-
# Generated by Django 1.11.8 on 2017-12-20 22:44
from __future__ import unicode_literals

from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ('healthsites', '0020_auto_20160627_1038'),
    ]

    operations = [
        migrations.RunSQL('create schema if not exists core_utils;'),

        migrations.RunSQL("""

            CREATE OR REPLACE FUNCTION core_utils.get_events() RETURNS TEXT AS

            -- TEST KOMENTAR
            $BODY$
            -- TEST KOMENTAR                
                            SELECT
                                json_agg(r.row)::TEXT AS data
                            FROM
                            (
                                SELECT 
                                    json_build_object(
                                        'assessment', json_build_object(
                                ag.name || '/' ||ac.name , 
                                json_build_object(
                                    'option', '',
                                    'value', selected_option,
                                    'description', ''
                                )
                            ),
                            'id', hs.id,
                            'created_date', hs.created_date,
                            'data_captor', wu.email,
                            'overall_assessment', hs.overall_assessment,
                            'name', hs.name,
                            'geometry', ARRAY[ST_X(hs.point_geometry), ST_Y(hs.point_geometry)],
                            'enriched', 'true',
                            'country', 'Unknown'
                            ) AS row	
                    	FROM
				public.healthsites_healthsiteassessmententryinteger hai
			INNER JOIN 	
				healthsites_healthsiteassessment hs
			ON
				hai.healthsite_assessment_id = hs.id
			INNER JOIN
				webusers_webuser wu
			    ON
				hs.data_captor_id = wu.id
			INNER JOIN
				healthsites_assessmentcriteria ac
			ON
				ac.id = hai.assessment_criteria_id
				
			INNER JOIN
				healthsites_assessmentgroup ag
			    ON
				ag.id = ac.assessment_group_id
                )r; 
                
                
                $BODY$
            LANGUAGE SQL STABLE;
            """),
    ]
