from setuptools import setup, find_packages

setup(
    name="otp-manager-python",
    version="1.0.0",
    description="OTP Manager official Python / Async Python SDK",
    long_description=open("README.md", encoding="utf-8").read(),
    long_description_content_type="text/markdown",
    author="OTP Manager",
    url="https://github.com/otp-manager/otp-manager-python",
    packages=find_packages(),
    install_requires=[
        "requests>=2.25.0",
    ],
    extras_require={
        "async": ["httpx>=0.20.0"],
    },
    python_requires=">=3.8",
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
    ],
)
