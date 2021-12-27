#! /usr/bin/env python
import json

from setuptools import setup


with open('package.json') as f:
    package_data = json.loads(f.read())
    version = package_data['version']

# py-vercel
setup(
    name='py-vercel',
    version=version,
    packages=[
        'lambda'
    ],
    install_requires=[
        'Werkzeug',
        'py-exceptions'
    ]
)
